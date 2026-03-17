import pandas as pd
import os
from sqlalchemy import create_engine
import urllib

# 1. Cấu hình kết nối SQL Server của bạn
server = r'DIGGORY\SQLEXPRESS'
database = 'web_ban_truyen'
username = 'sa'
password = '1' # Mật khẩu bạn đã cung cấp

# Chuyển đổi chuỗi kết nối sang định dạng SQLAlchemy
params = urllib.parse.quote_plus(
    f"DRIVER={{ODBC Driver 17 for SQL Server}};"
    f"SERVER={server};"
    f"DATABASE={database};"
    f"UID={username};"
    f"PWD={password}"
)
engine = create_engine(f"mssql+pyodbc:///?odbc_connect={params}")

# 2. Đường dẫn đến thư mục chứa file CSV của bạn
# Hãy thay đường dẫn bên dưới bằng đường dẫn thực tế trên máy bạn
folder_path = r'C:\Users\ZZ\Desktop\Work\Project\backend\data' 

files = [f for f in os.listdir(folder_path) if f.endswith('.csv')]

print(f"--- Bắt đầu đẩy {len(files)} file vào SQL Server ---")

for file in files:
    file_path = os.path.join(folder_path, file)
    # Lấy tên file làm tên bảng (VD: Product.csv -> Product)
    table_name = os.path.splitext(file)[0]
    
    try:
        # Đọc file (encoding utf-8-sig giúp nhận diện tiếng Việt có dấu)
        df = pd.read_csv(file_path, encoding='utf-8-sig')
        
        # Đẩy dữ liệu vào SQL
        # if_exists='replace': Xóa bảng cũ tạo lại bảng mới
        # if_exists='append': Thêm dữ liệu vào bảng đã có sẵn
        df.to_sql(table_name, con=engine, if_exists='replace', index=False)
        
        print(f"✅ Thành công: {file} -> Table: [{table_name}]")
    except Exception as e:
        print(f"❌ Lỗi tại file {file}: {e}")

print("\n--- TẤT CẢ ĐÃ HOÀN TẤT ---")
