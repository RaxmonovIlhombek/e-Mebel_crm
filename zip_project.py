import os
import zipfile

def zip_project(folder_path, zip_path):
    # Directories/files to exclude
    excludes = ['node_modules', 'venv', '.git', '__pycache__', '.pytest_cache', '.idea', '.vscode']
    
    print(f"Boshlandi: {folder_path} ...")
    
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(folder_path):
            # Mutate dirs in-place to exclude certain directories
            dirs[:] = [d for d in dirs if d not in excludes]
            
            for file in files:
                # Do not zip the zip file itself if it's in the same dir
                if file == os.path.basename(zip_path) or file.endswith('.zip'):
                    continue
                    
                file_path = os.path.join(root, file)
                arcname = os.path.relpath(file_path, folder_path)
                try:
                    zipf.write(file_path, arcname)
                except Exception as e:
                    print(f"Xatolik (o'tkazib yuboriladi): {file_path} - {e}")
                    
    print(f"Muvaffaqiyatli yakunlandi! Fayl: {zip_path}")

if __name__ == "__main__":
    src_dir = r"C:\Users\rahmo\OneDrive\Desktop\e-mebel"
    out_zip = r"C:\Users\rahmo\OneDrive\Desktop\e-mebel_loyiha.zip"
    zip_project(src_dir, out_zip)
