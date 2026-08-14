CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique
  ON users (LOWER(email));

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_name_unique
  ON users (LOWER(name));

DELETE FROM user_passwords
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE users.uid = user_passwords.uid
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'user_passwords_uid_fkey'
  ) THEN
    ALTER TABLE user_passwords
      ADD CONSTRAINT user_passwords_uid_fkey
      FOREIGN KEY (uid) REFERENCES users(uid) ON DELETE CASCADE;
  END IF;
END $$;
