# -*- coding: utf-8 -*-
"""
Veritabani Yonetimi - PostgreSQL
Portfoy ve kullanici verilerini saklar.
"""

from contextlib import contextmanager
from typing import Iterator, List, Optional

import psycopg2
from psycopg2.extras import RealDictCursor

from config import DATABASE_URL


class Database:
    def __init__(self, database_url: str = DATABASE_URL):
        """Veritabani baglantisini baslat"""
        self.database_url = database_url
        self.init_database()

    @contextmanager
    def get_connection(self) -> Iterator[psycopg2.extensions.connection]:
        """PostgreSQL baglantisi olustur"""
        conn = psycopg2.connect(self.database_url, cursor_factory=RealDictCursor)
        try:
            yield conn
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()

    def _portfolio_kolonlarini_guncelle(self, cursor):
        """Eski tabloyu user_id kolonu ile uyumlu hale getirir."""
        cursor.execute(
            """
            ALTER TABLE portfolio
            ADD COLUMN IF NOT EXISTS user_id INTEGER
            """
        )

    def _benzersiz_kullanici_adi_uret(self, cursor, aday: str, user_id: int = None) -> str:
        """Mevcut kullanici adlarina gore benzersiz bir aday uretir."""
        base = (aday or "kullanici").strip().lower()
        if not base:
            base = "kullanici"

        base = "".join(ch for ch in base if ch.isalnum() or ch == "_")
        if not base:
            base = "kullanici"

        suffix = 0
        while True:
            username = base if suffix == 0 else f"{base}{suffix}"
            if user_id is None:
                cursor.execute("SELECT id FROM users WHERE username = %s", (username,))
            else:
                cursor.execute(
                    "SELECT id FROM users WHERE username = %s AND id != %s",
                    (username, user_id),
                )
            if not cursor.fetchone():
                return username
            suffix += 1

    def _users_kolonlarini_guncelle(self, cursor):
        """Eski users tablosunu username kolonu ile uyumlu hale getirir."""
        cursor.execute(
            """
            ALTER TABLE users
            ADD COLUMN IF NOT EXISTS username TEXT
            """
        )

        cursor.execute("SELECT id, email, username FROM users")
        tum_kullanicilar = cursor.fetchall()

        for row in tum_kullanicilar:
            username = (row["username"] or "").strip().lower()
            if username:
                continue

            email_prefix = (row["email"] or "").split("@")[0]
            yeni_username = self._benzersiz_kullanici_adi_uret(cursor, email_prefix, row["id"])
            cursor.execute(
                "UPDATE users SET username = %s WHERE id = %s",
                (yeni_username, row["id"]),
            )

        cursor.execute(
            "CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username)"
        )

    def init_database(self):
        """Veritabani tablolarini olustur"""
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    """
                    CREATE TABLE IF NOT EXISTS users (
                        id SERIAL PRIMARY KEY,
                        email TEXT NOT NULL UNIQUE,
                        username TEXT UNIQUE,
                        password_hash TEXT NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                    """
                )

                cursor.execute(
                    """
                    CREATE TABLE IF NOT EXISTS portfolio (
                        id SERIAL PRIMARY KEY,
                        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                        sembol TEXT NOT NULL,
                        adet DOUBLE PRECISION NOT NULL,
                        maliyet DOUBLE PRECISION NOT NULL,
                        eklenme_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                    """
                )

                cursor.execute(
                    "CREATE INDEX IF NOT EXISTS idx_portfolio_user_id ON portfolio(user_id)"
                )

                # Eski kurulumlar icin sema uyumlulugu
                self._portfolio_kolonlarini_guncelle(cursor)
                self._users_kolonlarini_guncelle(cursor)

        print("✅ PostgreSQL veritabanı başarıyla hazırlandı!")


class UserManager:
    """Kullanici islemlerini yoneten sinif"""

    def __init__(self):
        self.db = Database()

    def kullanici_olustur(self, email: str, username: str, password_hash: str) -> dict:
        with self.db.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    """
                    INSERT INTO users (email, username, password_hash)
                    VALUES (%s, %s, %s)
                    RETURNING id, email, username
                    """,
                    (email.lower().strip(), username.lower().strip(), password_hash),
                )
                row = cursor.fetchone()

        return {
            "id": row["id"],
            "email": row["email"],
            "username": row["username"],
        }

    def email_ile_kullanici_getir(self, email: str) -> Optional[dict]:
        with self.db.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    "SELECT * FROM users WHERE email = %s",
                    (email.lower().strip(),),
                )
                row = cursor.fetchone()

        if not row:
            return None

        return {
            "id": row["id"],
            "email": row["email"],
            "username": row["username"],
            "password_hash": row["password_hash"],
            "created_at": row["created_at"],
        }

    def id_ile_kullanici_getir(self, user_id: int) -> Optional[dict]:
        with self.db.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
                row = cursor.fetchone()

        if not row:
            return None

        return {
            "id": row["id"],
            "email": row["email"],
            "username": row["username"],
            "password_hash": row["password_hash"],
            "created_at": row["created_at"],
        }

    def username_ile_kullanici_getir(self, username: str) -> Optional[dict]:
        with self.db.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    "SELECT * FROM users WHERE username = %s",
                    (username.lower().strip(),),
                )
                row = cursor.fetchone()

        if not row:
            return None

        return {
            "id": row["id"],
            "email": row["email"],
            "username": row["username"],
            "password_hash": row["password_hash"],
            "created_at": row["created_at"],
        }


class PortfolioManager:
    """Portfoy islemlerini yoneten sinif"""

    def __init__(self):
        self.db = Database()

    def hisse_ekle(self, user_id: int, sembol: str, adet: float, maliyet: float) -> dict:
        with self.db.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    """
                    INSERT INTO portfolio (user_id, sembol, adet, maliyet)
                    VALUES (%s, %s, %s, %s)
                    RETURNING id
                    """,
                    (user_id, sembol.upper(), adet, maliyet),
                )
                row = cursor.fetchone()

        return {
            "id": row["id"],
            "user_id": user_id,
            "sembol": sembol.upper(),
            "adet": adet,
            "maliyet": maliyet,
            "mesaj": "Hisse başarıyla eklendi!",
        }

    def tum_hisseleri_getir(self, user_id: int) -> List[dict]:
        with self.db.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT * FROM portfolio
                    WHERE user_id = %s
                    ORDER BY eklenme_tarihi DESC
                    """,
                    (user_id,),
                )
                rows = cursor.fetchall()

        return [dict(row) for row in rows]

    def hisse_sil(self, user_id: int, hisse_id: int) -> dict:
        with self.db.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    """
                    DELETE FROM portfolio
                    WHERE id = %s AND user_id = %s
                    RETURNING id
                    """,
                    (hisse_id, user_id),
                )
                row = cursor.fetchone()

        if not row:
            return {"hata": "Hisse bulunamadı!"}

        return {"mesaj": "Hisse başarıyla silindi!", "silinen_id": row["id"]}

    def hisse_guncelle(
        self,
        user_id: int,
        hisse_id: int,
        adet: Optional[float] = None,
        maliyet: Optional[float] = None,
    ) -> dict:
        with self.db.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT adet, maliyet FROM portfolio
                    WHERE id = %s AND user_id = %s
                    """,
                    (hisse_id, user_id),
                )
                hisse = cursor.fetchone()

                if not hisse:
                    return {"hata": "Hisse bulunamadı!"}

                yeni_adet = adet if adet is not None else hisse["adet"]
                yeni_maliyet = maliyet if maliyet is not None else hisse["maliyet"]

                cursor.execute(
                    """
                    UPDATE portfolio
                    SET adet = %s, maliyet = %s
                    WHERE id = %s AND user_id = %s
                    """,
                    (yeni_adet, yeni_maliyet, hisse_id, user_id),
                )

        return {
            "mesaj": "Hisse başarıyla güncellendi!",
            "id": hisse_id,
            "adet": yeni_adet,
            "maliyet": yeni_maliyet,
        }
