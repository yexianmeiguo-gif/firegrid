#!/usr/bin/env python3
"""
从 Word 文档提取展会供应商数据（优化版）
"""

from docx import Document
import json
import re

def clean_text(text):
    """清理文本"""
    return text.strip().replace('\u3000', ' ').replace('\xa0', ' ')

def extract_suppliers_from_docx(doc_path):
    """提取供应商信息"""
    doc = Document(doc_path)
    suppliers = []
    
    current_supplier = {}
    in_supplier_section = False
    
    for para in doc.paragraphs:
        text = clean_text(para.text)
        
        if not text:
            continue
        
        # 检测是否进入供应商名录区域
        if '参展商名录' in text or 'List Of Exhibitors' in text:
            in_supplier_section = True
            continue
        
        if not in_supplier_section:
            continue
        
        # 检测公司名称（以 》 开头）
        if text.startswith('》'):
            # 保存上一个供应商
            if current_supplier and current_supplier.get('company_name'):
                suppliers.append(current_supplier)
            
            # 开始新供应商
            company_name = text.lstrip('》').strip()
            current_supplier = {'company_name': company_name}
        
        # 展台号
        elif '馆号' in text or 'Hall-Booth' in text or 'Booth' in text:
            # 下一行可能是展台号
            pass
        
        elif text.startswith('W') or text.startswith('E') or re.match(r'^[A-Z]\d+-\d+', text):
            # 展台号格式：W1-58, E2-30 等
            current_supplier['booth'] = text
        
        # 地址
        elif text.startswith('地址') or text.startswith('Address'):
            address = text.split(':', 1)[-1].strip() if ':' in text else text.replace('地址', '').replace('Address', '').strip()
            current_supplier['address'] = address
        
        # 邮编
        elif text.startswith('邮编') or 'P.C' in text or 'Postcode' in text:
            postcode = re.sub(r'[^\d]', '', text)
            if postcode:
                current_supplier['postcode'] = postcode
        
        # 电话
        elif text.startswith('电话') or text.startswith('Tel'):
            phone = text.split(':', 1)[-1].strip() if ':' in text else text
            phone = phone.replace('电话', '').replace('Tel', '').strip()
            # 清理但保留格式
            phone = re.sub(r'\s+', ' ', phone)
            if phone:
                current_supplier['phone'] = phone
        
        # 传真
        elif text.startswith('传真') or text.startswith('Fax'):
            fax = text.split(':', 1)[-1].strip() if ':' in text else text
            fax = fax.replace('传真', '').replace('Fax', '').strip()
            if fax:
                current_supplier['fax'] = fax
        
        # 邮箱
        elif text.startswith('电邮') or 'E-mail' in text or 'Email' in text or '@' in text:
            # 提取邮箱地址
            email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', text)
            if email_match:
                current_supplier['email'] = email_match.group()
        
        # 网址
        elif text.startswith('网址') or 'URL' in text or 'Website' in text or text.startswith('http'):
            url = text.split(':', 1)[-1].strip() if ':' in text else text
            url = url.replace('网址', '').replace('URL', '').replace('Website', '').strip()
            # 清理空格
            url = url.replace(' ', '')
            if url.startswith('http') or url.startswith('www'):
                current_supplier['website'] = url
        
        # 联系人
        elif text.startswith('联系人') or text.startswith('Contact'):
            contact = text.split(':', 1)[-1].strip() if ':' in text else text
            contact = contact.replace('联系人', '').replace('Contact', '').strip()
            if contact:
                current_supplier['contact_person'] = contact
        
        # 主营产品
        elif text.startswith('主营') or text.startswith('产品'):
            products = text.split(':', 1)[-1].strip() if ':' in text else text
            products = products.replace('主营', '').replace('产品', '').strip()
            if products:
                current_supplier['products'] = products
    
    # 最后一个供应商
    if current_supplier and current_supplier.get('company_name'):
        suppliers.append(current_supplier)
    
    return suppliers

def main():
    print('🚀 开始提取展会供应商数据（优化版）...\n')
    
    word_dir = '/Users/rabbit-y/Documents/消防装备供应商资料/供应商/消防设备供应商目录（2025）/消防设备供应商目录word版（清晰）'
    
    doc_files = [
        f'{word_dir}/消防设备供应商目录（2025）_1-100.docx',
        f'{word_dir}/消防设备供应商目录（2025）_101-200.docx',
        f'{word_dir}/消防设备供应商目录（2025）_201-300.docx',
        f'{word_dir}/消防设备供应商目录（2025）_301-400.docx',
        f'{word_dir}/消防设备供应商目录（2025）_401-500.docx',
        f'{word_dir}/消防设备供应商目录（2025）_501-600.docx',
        f'{word_dir}/消防设备供应商目录（2025）_601-772.docx',
    ]
    
    all_suppliers = []
    
    for doc_file in doc_files:
        print(f'📄 处理: {doc_file.split("/")[-1]}')
        suppliers = extract_suppliers_from_docx(doc_file)
        all_suppliers.extend(suppliers)
        print(f'   ✅ 提取 {len(suppliers)} 家供应商\n')
    
    print(f'🎉 总共提取: {len(all_suppliers)} 家供应商\n')
    
    # 显示前 10 个
    print('📋 示例数据:\n')
    for i, supplier in enumerate(all_suppliers[:10]):
        print(f'{i+1}. {supplier.get("company_name", "(无名称)")}')
        if supplier.get('booth'):
            print(f'   展台: {supplier["booth"]}')
        if supplier.get('phone'):
            print(f'   电话: {supplier["phone"]}')
        if supplier.get('email'):
            print(f'   邮箱: {supplier["email"]}')
        if supplier.get('website'):
            print(f'   网址: {supplier["website"]}')
        print('')
    
    # 统计完整性
    has_phone = sum(1 for s in all_suppliers if s.get('phone'))
    has_email = sum(1 for s in all_suppliers if s.get('email'))
    has_website = sum(1 for s in all_suppliers if s.get('website'))
    
    print(f'\n📊 数据完整性:')
    print(f'   电话: {has_phone}/{len(all_suppliers)} ({has_phone/len(all_suppliers)*100:.1f}%)')
    print(f'   邮箱: {has_email}/{len(all_suppliers)} ({has_email/len(all_suppliers)*100:.1f}%)')
    print(f'   网址: {has_website}/{len(all_suppliers)} ({has_website/len(all_suppliers)*100:.1f}%)')
    
    # 保存
    output_path = '/Users/rabbit-y/firegrid/backend/scripts/exhibition-suppliers.json'
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(all_suppliers, f, ensure_ascii=False, indent=2)
    
    print(f'\n💾 已保存到: {output_path}')

if __name__ == '__main__':
    main()
