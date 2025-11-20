-- SQL Command to Insert HMR Organization Admin
-- Organization: ORG-000001 (HMR Builders)
-- Organization ID: 85a17682-5df8-4dd9-98fe-9a64fce0d115
-- Email: admin@hmr.com
-- Password: hmr123

-- STEP 1: Generate bcrypt hash for 'hmr123' using:
--    - Online: https://bcrypt-generator.com/ (rounds: 10)
--    - Or Node.js: bcrypt.hashSync('hmr123', 10)

-- STEP 2: Replace 'YOUR_BCRYPT_HASH_HERE' below with the generated hash

-- Option A: If table is "organization_admins" or "org_admins"
INSERT INTO organization_admins (
    id,
    email,
    password,
    "fullName",
    "organizationId",
    role,
    "createdAt",
    "updatedAt"
) VALUES (
    gen_random_uuid(),
    'admin@hmr.com',
    'YOUR_BCRYPT_HASH_HERE',  -- Replace with bcrypt hash of 'hmr123'
    'HMR Admin',
    '85a17682-5df8-4dd9-98fe-9a64fce0d115',
    'organization_admin',
    NOW(),
    NOW()
);

-- Option B: If table is "users" with role field
-- INSERT INTO users (
--     id,
--     email,
--     password,
--     "fullName",
--     "organizationId",
--     role,
--     "createdAt",
--     "updatedAt"
-- ) VALUES (
--     gen_random_uuid(),
--     'admin@hmr.com',
--     'YOUR_BCRYPT_HASH_HERE',  -- Replace with bcrypt hash of 'hmr123'
--     'HMR Admin',
--     '85a17682-5df8-4dd9-98fe-9a64fce0d115',
--     'organization_admin',
--     NOW(),
--     NOW()
-- );

-- Option C: If columns use snake_case
-- INSERT INTO organization_admins (
--     id,
--     email,
--     password,
--     full_name,
--     organization_id,
--     role,
--     created_at,
--     updated_at
-- ) VALUES (
--     gen_random_uuid(),
--     'admin@hmr.com',
--     'YOUR_BCRYPT_HASH_HERE',  -- Replace with bcrypt hash of 'hmr123'
--     'HMR Admin',
--     '85a17682-5df8-4dd9-98fe-9a64fce0d115',
--     'organization_admin',
--     NOW(),
--     NOW()
-- );

