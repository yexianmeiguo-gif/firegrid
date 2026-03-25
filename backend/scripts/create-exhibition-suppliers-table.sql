-- 创建展会供应商表
CREATE TABLE IF NOT EXISTS exhibition_suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(500) NOT NULL,
    booth VARCHAR(100),          -- 展台号（如 W1-58）
    address TEXT,                 -- 地址
    postcode VARCHAR(20),         -- 邮编
    phone VARCHAR(200),           -- 电话
    fax VARCHAR(100),             -- 传真
    email VARCHAR(200),           -- 邮箱
    website VARCHAR(500),         -- 网址
    contact_person VARCHAR(200),  -- 联系人
    products TEXT,                -- 主营产品
    source VARCHAR(50) DEFAULT 'FIRE_2025',  -- 数据来源
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 索引
    CONSTRAINT exhibition_suppliers_company_name_unique UNIQUE(company_name)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_exhibition_suppliers_company_name ON exhibition_suppliers(company_name);
CREATE INDEX IF NOT EXISTS idx_exhibition_suppliers_booth ON exhibition_suppliers(booth);
CREATE INDEX IF NOT EXISTS idx_exhibition_suppliers_email ON exhibition_suppliers(email);

-- 注释
COMMENT ON TABLE exhibition_suppliers IS '展会供应商数据库（2025 中国国际消防设备技术交流展览会）';
COMMENT ON COLUMN exhibition_suppliers.company_name IS '公司名称';
COMMENT ON COLUMN exhibition_suppliers.booth IS '展台号';
COMMENT ON COLUMN exhibition_suppliers.phone IS '电话';
COMMENT ON COLUMN exhibition_suppliers.email IS '邮箱';
COMMENT ON COLUMN exhibition_suppliers.website IS '官网';
COMMENT ON COLUMN exhibition_suppliers.source IS '数据来源（展会名称）';
