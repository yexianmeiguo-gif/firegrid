#!/usr/bin/env python3
"""
ChromaDB 查询脚本 - 使用 bge-m3 (1024维) 模型
供 NestJS 后端调用
"""
import sys
import json
import chromadb
import requests


def get_bge_embedding(text, ollama_url="http://localhost:11434"):
    """使用 Ollama bge-m3 生成 1024 维嵌入向量"""
    try:
        response = requests.post(
            f"{ollama_url}/api/embeddings",
            json={"model": "bge-m3", "prompt": text},
            timeout=30
        )
        response.raise_for_status()
        return response.json()['embedding']
    except Exception as e:
        print(json.dumps({"error": f"Failed to get embedding: {str(e)}"}), file=sys.stderr)
        sys.exit(1)


def search_chromadb(query, n_results=5, chroma_db_path="/Users/rabbit-y/firegrid-chroma-db"):
    """查询 ChromaDB 向量数据库"""
    try:
        # 1. 生成查询向量
        query_embedding = get_bge_embedding(query)
        
        # 2. 连接 ChromaDB
        client = chromadb.PersistentClient(path=chroma_db_path)
        collection = client.get_collection(name="firegrid_docs")
        
        # 3. 查询
        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=n_results
        )
        
        # 4. 格式化结果
        formatted_results = []
        for i in range(len(results['ids'][0])):
            formatted_results.append({
                "id": results['ids'][0][i],
                "document": results['documents'][0][i],
                "metadata": results['metadatas'][0][i] if results['metadatas'][0][i] else {},
                "distance": results['distances'][0][i] if results['distances'][0] else 0,
            })
        
        return {
            "success": True,
            "query": query,
            "results": formatted_results,
            "count": len(formatted_results)
        }
    
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "query": query
        }


if __name__ == "__main__":
    # 从命令行参数读取查询
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: chroma_search.py <query> [n_results]"}))
        sys.exit(1)
    
    query = sys.argv[1]
    n_results = int(sys.argv[2]) if len(sys.argv) > 2 else 5
    
    # 执行查询
    result = search_chromadb(query, n_results)
    
    # 输出 JSON 结果
    print(json.dumps(result, ensure_ascii=False, indent=2))
