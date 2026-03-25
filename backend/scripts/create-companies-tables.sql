-- =============================================
-- FireGrid 供应商管理系统 - 数据库表结构
-- =============================================

-- 1. 公司表（统一管理制造商和供应商）
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    name_en TEXT,
    short_name TEXT,
    
    -- 公司类型
    is_manufacturer BOOLEAN DEFAULT false,
    is_supplier BOOLEAN DEFAULT false,
    
    -- 合作状态 ⭐
    partnership_status VARCHAR(50) DEFAULT 'none',
    -- 'partner'（合作商）| 'subscriber'（订阅商）| 'exhibition'（展会商）| 'none'（普通）
    
    partnership_level INTEGER DEFAULT 0,
    subscription_start_date DATE,
    subscription_end_date DATE,
    
    -- 联系信息
    contact_phone VARCHAR(200),
    contact_email VARCHAR(200),
    website VARCHAR(500),
    address TEXT,
    postcode VARCHAR(20),
    contact_person VARCHAR(200),
    
    -- 展会信息
    exhibition_booth TEXT,
    exhibition_year INTEGER,
    
    -- 数据来源
    source VARCHAR(50),
    source_url TEXT,
    
    -- 公司实力
    company_scale VARCHAR(50),
    certification TEXT[],
    
    -- 统计信息
    product_count INTEGER DEFAULT 0,
    total_inquiries INTEGER DEFAULT 0,
    
    -- 状态
    is_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT companies_name_unique UNIQUE(name)
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_companies_partnership_status ON companies(partnership_status);
CREATE INDEX IF NOT EXISTS idx_companies_partnership_level ON companies(partnership_level DESC);
CREATE INDEX IF NOT EXISTS idx_companies_is_manufacturer ON companies(is_manufacturer);
CREATE INDEX IF NOT EXISTS idx_companies_is_supplier ON companies(is_supplier);
CREATE INDEX IF NOT EXISTS idx_companies_source ON companies(source);
CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);

-- 全文搜索索引
CREATE INDEX IF NOT EXISTS idx_companies_name_gin ON companies USING gin(to_tsvector('simple', name));


-- =============================================
-- 2. 产品-供应商关联表（多对多）⭐
-- =============================================
CREATE TABLE IF NOT EXISTS equipment_suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id TEXT NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    -- 供应商类型
    supplier_type VARCHAR(50) DEFAULT 'reseller',
    -- 'manufacturer'（制造商直销）| 'reseller'（经销商）| 'agent'（代理商）
    
    -- 价格信息（可选）
    price_min DECIMAL(12,2),
    price_max DECIMAL(12,2),
    price_unit VARCHAR(50),
    
    -- 可用性
    is_available BOOLEAN DEFAULT true,
    lead_time_days INTEGER,
    min_order_quantity INTEGER DEFAULT 1,
    
    -- 优先级 ⭐
    priority INTEGER DEFAULT 0,
    -- 优先级规则：
    -- 合作商 = 100
    -- 订阅商 = 50
    -- 展会商 = 10
    -- 普通 = 0
    
    recommendation_reason TEXT,
    
    -- 统计
    inquiry_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT equipment_suppliers_unique UNIQUE(equipment_id, supplier_id)
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_equipment_suppliers_equipment ON equipment_suppliers(equipment_id);
CREATE INDEX IF NOT EXISTS idx_equipment_suppliers_supplier ON equipment_suppliers(supplier_id);
CREATE INDEX IF NOT EXISTS idx_equipment_suppliers_priority ON equipment_suppliers(priority DESC);
CREATE INDEX IF NOT EXISTS idx_equipment_suppliers_available ON equipment_suppliers(is_available);


-- =============================================
-- 3. 询价记录表
-- =============================================
CREATE TABLE IF NOT EXISTS inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES users(id),
    equipment_id TEXT NOT NULL REFERENCES equipment(id),
    supplier_id UUID REFERENCES companies(id),
    
    -- 询价内容
    quantity INTEGER,
    budget_min DECIMAL(12,2),
    budget_max DECIMAL(12,2),
    requirements TEXT,
    urgency VARCHAR(50),
    
    -- 状态
    status VARCHAR(50) DEFAULT 'pending',
    
    -- 供应商回复
    supplier_response TEXT,
    quoted_price DECIMAL(12,2),
    response_time TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_inquiries_user ON inquiries(user_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_equipment ON inquiries(equipment_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_supplier ON inquiries(supplier_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);


-- =============================================
-- 4. 修改 equipment 表（添加外键）
-- =============================================
ALTER TABLE equipment 
    ADD COLUMN IF NOT EXISTS manufacturer_id UUID REFERENCES companies(id),
    ADD COLUMN IF NOT EXISTS primary_supplier_id UUID REFERENCES companies(id);

CREATE INDEX IF NOT EXISTS idx_equipment_manufacturer ON equipment(manufacturer_id);
CREATE INDEX IF NOT EXISTS idx_equipment_primary_supplier ON equipment(primary_supplier_id);


-- =============================================
-- 注释
-- =============================================
COMMENT ON TABLE companies IS '公司表（统一管理制造商和供应商）';
COMMENT ON TABLE equipment_suppliers IS '产品-供应商关联表（多对多）';
COMMENT ON TABLE inquiries IS '询价记录表';

COMMENT ON COLUMN companies.partnership_status IS '合作状态：partner/subscriber/exhibition/none';
COMMENT ON COLUMN companies.partnership_level IS '合作等级（1-5，数字越大优先级越高）';
COMMENT ON COLUMN equipment_suppliers.priority IS '优先级（合作商=100，订阅商=50，展会商=10，普通=0）';
