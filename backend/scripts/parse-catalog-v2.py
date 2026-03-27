#!/usr/bin/env python3
"""
解析国家消防产品目录 PDF
提取产品名称、标准号、描述
"""

import re
import json

def parse_catalog():
    with open('/Users/rabbit-y/firegrid/backend/scripts/消防产品目录2025.txt', 'r', encoding='utf-8') as f:
        content = f.read()
    
    products = []
    
    # 产品名称模式（通常在左侧列）
    product_names = [
        '点型感烟火灾探测器', '点型感温火灾探测器', '独立式感烟火灾探测报警器',
        '独立式感温火灾探测报警器', '点型红外火焰探测器', '吸气式感烟火灾探测器',
        '图像型火灾探测器', '点型一氧化碳火灾探测器', '点型紫外火焰探测器',
        '线型光束感烟火灾探测器', '线型感温火灾探测器', '可燃气体探测器',
        '电气火灾监控探测器', '家用火灾探测器', '手动火灾报警按钮',
        '防火监控报警插座与开关', '消火栓按钮', '手动报警开关',
        '火灾报警控制器', '可燃气体报警控制器', '家用火灾报警控制器',
        '电气火灾监控设备', '家用火灾控制中心监控设备', '城市消防远程监控设备',
        '消防设备电源监控系统', '防火门监控器', '火灾声和/或光警报器',
        '火灾显示盘', '消防联动控制器', '气体灭火控制器', '消防电气控制装置',
        '消防电动装置', '逃生与救援用车窗玻璃电动击碎装置', '消防设备应急电源',
        '消防应急广播设备', '消防电话', '传输设备', '模块', '消防控制室图形显示装置',
        '手提式水基型灭火器', '手提式干粉灭火器', '手提式二氧化碳灭火器',
        '手提式洁净气体灭火器', '推车式水基型灭火器', '推车式干粉灭火器',
        '推车式二氧化碳灭火器', '推车式洁净气体灭火器', '简易式水基型灭火器',
        '简易式干粉灭火器', '简易式氢氟烃类气体灭火器',
        '消防应急疏散标志灯具', '消防应急照明灯具', '消防应急照明标志复合灯具',
        '应急照明控制器', '应急照明集中电源', '应急照明配电箱',
        '普通消防安全标志牌', '蓄光消防安全标志牌', '逆反射消防安全标志牌',
        '荧光消防安全标志牌', '搪瓷消防安全标志牌', '组合材料消防安全标志牌',
        '内光源消防安全标志牌', '逃生缓降器', '逃生梯', '逃生滑道',
        '应急逃生器', '逃生绳', '过滤式消防自救呼吸器', '化学氧消防自救呼吸器',
        '洒水喷头', '雨淋报警阀', '预作用装置', '水流指示器', '湿式报警阀',
        '干式报警阀', '消防用减压阀', '消防用压力开关', '末端试水装置',
        '自动跟踪定位射流灭火装置', '细水雾灭火装置', '固定消防炮灭火系统',
        '气体灭火系统', '泡沫灭火装置', '干粉灭火装置'
    ]
    
    # 标准号模式
    standard_pattern = re.compile(r'GB\s*\d+(\.\d+)?|XF\s*\d+|XF/T\s*\d+')
    
    lines = content.split('\n')
    
    for i, line in enumerate(lines):
        line = line.strip()
        
        # 检查是否包含产品名称
        for product_name in product_names:
            if product_name in line:
                # 向后查找标准号（通常在后面几行）
                standards = []
                description = ''
                
                for j in range(i, min(i + 10, len(lines))):
                    next_line = lines[j].strip()
                    
                    # 提取标准号
                    found_standards = standard_pattern.findall(next_line)
                    if found_standards:
                        standards.extend([s.replace(' ', '') for s in found_standards])
                    
                    # 提取描述（包含"适用"、"用于"等关键词）
                    if ('适用' in next_line or '用于' in next_line or '供' in next_line) and len(next_line) > 20:
                        description = next_line
                        break
                
                if standards:
                    products.append({
                        'name': product_name,
                        'standard_name': product_name,
                        'standards': list(set(standards)),  # 去重
                        'description': description,
                        'category': '建筑消防设施' if i < len(lines) // 2 else '消防救援装备'
                    })
                    break
    
    # 去重（按产品名称）
    unique_products = {}
    for p in products:
        if p['name'] not in unique_products:
            unique_products[p['name']] = p
    
    result = list(unique_products.values())
    
    print(f'✅ 解析完成！共提取 {len(result)} 个产品\n')
    
    # 输出示例
    print('📋 示例产品:\n')
    for i, p in enumerate(result[:10]):
        print(f"{i+1}. {p['name']}")
        print(f"   标准: {', '.join(p['standards'])}")
        print(f"   描述: {p['description'][:50]}..." if p['description'] else "   描述: (无)")
        print()
    
    # 保存
    output_path = '/Users/rabbit-y/firegrid/backend/scripts/product-catalog-parsed.json'
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    
    print(f'💾 已保存到: {output_path}\n')
    
    return result

if __name__ == '__main__':
    products = parse_catalog()
    
    # 统计
    standards_count = sum(len(p['standards']) for p in products)
    print(f'📊 统计:')
    print(f'  产品总数: {len(products)}')
    print(f'  标准总数: {standards_count}')
    print(f'  平均每个产品: {standards_count / len(products):.1f} 个标准')
