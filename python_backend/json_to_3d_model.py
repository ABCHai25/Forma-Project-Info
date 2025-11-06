import json
import os
import shutil
import tkinter as tk
from tkinter import filedialog, messagebox
import numpy as np

class TreeModelGenerator:
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("JSON to 3D Model Generator")
        self.root.geometry("600x400")
        
        # Data variables
        self.json_path = None
        self.image_path = None
        self.tree_model_path = "tree_model/tree_lowpoly.obj"
        self.base_tree_height = 3.0  # Base tree model is 3m tall
        
        # Tree geometry
        self.tree_vertices = []
        self.tree_faces = []
        self.tree_normals = []
        
        self.create_ui()
        
    def create_ui(self):
        """Create the user interface."""
        # Title
        title_label = tk.Label(
            self.root,
            text="3D Tree Model Generator",
            font=('Arial', 16, 'bold'),
            pady=20
        )
        title_label.pack()
        
        # Instructions
        instructions = tk.Label(
            self.root,
            text="Select the JSON file and source image to generate a 3D model",
            font=('Arial', 10),
            pady=10
        )
        instructions.pack()
        
        # File selection frame
        file_frame = tk.Frame(self.root, pady=20)
        file_frame.pack()
        
        # JSON selection
        json_frame = tk.Frame(file_frame)
        json_frame.pack(pady=10)
        
        tk.Button(
            json_frame,
            text="Select JSON File",
            command=self.select_json,
            bg='#3498db',
            fg='white',
            font=('Arial', 10, 'bold'),
            padx=20,
            pady=5,
            width=20
        ).pack(side=tk.LEFT, padx=5)
        
        self.json_label = tk.Label(json_frame, text="No file selected", fg='gray')
        self.json_label.pack(side=tk.LEFT, padx=10)
        
        # Image selection
        image_frame = tk.Frame(file_frame)
        image_frame.pack(pady=10)
        
        tk.Button(
            image_frame,
            text="Select Source Image",
            command=self.select_image,
            bg='#3498db',
            fg='white',
            font=('Arial', 10, 'bold'),
            padx=20,
            pady=5,
            width=20
        ).pack(side=tk.LEFT, padx=5)
        
        self.image_label = tk.Label(image_frame, text="No file selected", fg='gray')
        self.image_label.pack(side=tk.LEFT, padx=10)
        
        # Generate button
        self.generate_btn = tk.Button(
            self.root,
            text="Generate 3D Model",
            command=self.generate_model,
            bg='#27ae60',
            fg='white',
            font=('Arial', 12, 'bold'),
            padx=30,
            pady=10,
            state=tk.DISABLED
        )
        self.generate_btn.pack(pady=20)
        
        # Status label
        self.status_label = tk.Label(
            self.root,
            text="",
            font=('Arial', 9),
            fg='blue'
        )
        self.status_label.pack(pady=10)
        
    def select_json(self):
        """Select JSON file."""
        file_path = filedialog.askopenfilename(
            title="Select JSON File",
            filetypes=[("JSON files", "*.json"), ("All files", "*.*")]
        )
        
        if file_path:
            self.json_path = file_path
            self.json_label.config(text=os.path.basename(file_path), fg='black')
            self.check_ready()
            
    def select_image(self):
        """Select source image."""
        file_path = filedialog.askopenfilename(
            title="Select Source Image",
            filetypes=[
                ("Image files", "*.jpg *.jpeg *.png *.bmp *.tif *.tiff"),
                ("All files", "*.*")
            ]
        )
        
        if file_path:
            self.image_path = file_path
            self.image_label.config(text=os.path.basename(file_path), fg='black')
            self.check_ready()
            
    def check_ready(self):
        """Check if both files are selected."""
        if self.json_path and self.image_path:
            self.generate_btn.config(state=tk.NORMAL)
            
    def load_tree_model(self):
        """Load the base tree model from OBJ file."""
        if not os.path.exists(self.tree_model_path):
            raise FileNotFoundError(f"Tree model not found: {self.tree_model_path}")
        
        self.tree_vertices = []
        self.tree_faces = []
        self.tree_normals = []
        
        with open(self.tree_model_path, 'r') as f:
            for line in f:
                line = line.strip()
                if line.startswith('v '):
                    # Vertex
                    parts = line.split()
                    self.tree_vertices.append([float(parts[1]), float(parts[2]), float(parts[3])])
                elif line.startswith('vn '):
                    # Normal
                    parts = line.split()
                    self.tree_normals.append([float(parts[1]), float(parts[2]), float(parts[3])])
                elif line.startswith('f '):
                    # Face
                    parts = line.split()[1:]
                    face = []
                    for part in parts:
                        # Handle format: v/vt/vn or v//vn or v
                        indices = part.split('/')
                        face.append(int(indices[0]))
                    self.tree_faces.append(face)
        
        self.status_label.config(text=f"Loaded tree model: {len(self.tree_vertices)} vertices, {len(self.tree_faces)} faces")
        
    def generate_model(self):
        """Generate the 3D model from JSON data."""
        try:
            self.status_label.config(text="Loading tree model...")
            self.root.update()
            
            # Load base tree model
            self.load_tree_model()
            
            self.status_label.config(text="Parsing JSON data...")
            self.root.update()
            
            # Load JSON data
            with open(self.json_path, 'r') as f:
                data = json.load(f)
            
            # Extract metadata
            tile_width = data['metadata']['real_dimensions_m']['width']
            tile_height = data['metadata']['real_dimensions_m']['height']
            
            # Collect all trees
            all_trees = []
            
            # Individual trees
            for tree in data['individual_trees']:
                all_trees.append({
                    'x': tree['centroid_m'][0],
                    'y': tree['centroid_m'][1],
                    'diameter': tree['estimated_diameter_m']
                })
            
            # Trees in clusters
            for cluster in data['tree_clusters']:
                for tree in cluster['populated_trees']:
                    all_trees.append({
                        'x': tree['position_m'][0],
                        'y': tree['position_m'][1],
                        'diameter': tree['estimated_diameter_m']
                    })
            
            self.status_label.config(text=f"Generating 3D model with {len(all_trees)} trees...")
            self.root.update()
            
            # Ask for save location
            output_path = filedialog.asksaveasfilename(
                defaultextension=".obj",
                filetypes=[("OBJ files", "*.obj"), ("All files", "*.*")],
                title="Save 3D Model"
            )
            
            if not output_path:
                self.status_label.config(text="Generation cancelled")
                return
            
            # Generate the model
            self.write_obj_file(output_path, tile_width, tile_height, all_trees)
            
            # Copy texture image
            output_dir = os.path.dirname(output_path)
            base_name = os.path.splitext(os.path.basename(output_path))[0]
            texture_dest = os.path.join(output_dir, f"{base_name}_texture{os.path.splitext(self.image_path)[1]}")
            shutil.copy2(self.image_path, texture_dest)
            
            self.status_label.config(text=f"✓ Model generated successfully!")
            messagebox.showinfo(
                "Success",
                f"3D Model generated!\n\n"
                f"Trees: {len(all_trees)}\n"
                f"Tile size: {tile_width:.1f}m × {tile_height:.1f}m\n\n"
                f"Files:\n{output_path}\n{texture_dest}"
            )
            
        except Exception as e:
            self.status_label.config(text="Error generating model")
            messagebox.showerror("Error", f"Failed to generate model:\n{str(e)}")
            
    def write_obj_file(self, output_path, tile_width, tile_height, trees):
        """Write the complete scene to OBJ file."""
        base_name = os.path.splitext(os.path.basename(output_path))[0]
        mtl_name = f"{base_name}.mtl"
        texture_name = f"{base_name}_texture{os.path.splitext(self.image_path)[1]}"
        
        # Open OBJ file for writing
        with open(output_path, 'w') as f:
            f.write("# Generated by Tree Model Generator\n")
            f.write(f"mtllib {mtl_name}\n\n")
            
            vertex_offset = 1  # OBJ indices start at 1
            
            # === Write Ground Plane ===
            f.write("# Ground Plane\n")
            f.write("o GroundPlane\n")
            
            # Ground vertices (corners of rectangle)
            f.write(f"v 0 0 0\n")
            f.write(f"v {tile_width} 0 0\n")
            f.write(f"v {tile_width} {tile_height} 0\n")
            f.write(f"v 0 {tile_height} 0\n")
            
            # Texture coordinates
            f.write("vt 0 0\n")
            f.write("vt 1 0\n")
            f.write("vt 1 1\n")
            f.write("vt 0 1\n")
            
            # Normal (pointing up in Z)
            f.write("vn 0 0 1\n")
            
            # Ground faces (two triangles)
            f.write("usemtl ground_texture\n")
            f.write(f"f 1/1/1 2/2/1 3/3/1\n")
            f.write(f"f 1/1/1 3/3/1 4/4/1\n\n")
            
            vertex_offset += 4
            
            # === Write Trees ===
            f.write("# Trees\n")
            f.write("usemtl tree_material\n\n")
            
            for i, tree in enumerate(trees):
                # Calculate tree height and scale
                tree_height = tree['diameter'] * 1.5  # Linear relationship: diameter × 1.5
                scale_factor = tree_height / self.base_tree_height
                
                f.write(f"# Tree {i+1} (diameter: {tree['diameter']:.1f}m, height: {tree_height:.1f}m)\n")
                f.write(f"o Tree_{i+1}\n")
                
                # Write transformed vertices
                # Flip Y-axis to correct tree positions (image coordinates to 3D world)
                for vertex in self.tree_vertices:
                    # Scale and translate with Y-axis flip only
                    x = vertex[0] * scale_factor + tree['x']
                    y = vertex[1] * scale_factor + (tile_height - tree['y'])  # Flip Y-axis
                    z = vertex[2] * scale_factor  # Keep Z unchanged (trees point up)
                    f.write(f"v {x} {y} {z}\n")
                
                # Write faces (adjust indices)
                for face in self.tree_faces:
                    face_str = " ".join([str(idx + vertex_offset - 1) for idx in face])
                    f.write(f"f {face_str}\n")
                
                vertex_offset += len(self.tree_vertices)
                f.write("\n")
        
        # Write MTL file
        mtl_path = os.path.splitext(output_path)[0] + ".mtl"
        with open(mtl_path, 'w') as f:
            f.write("# Material file generated by Tree Model Generator\n\n")
            
            # Ground material with texture
            f.write("newmtl ground_texture\n")
            f.write("Ka 1.0 1.0 1.0\n")
            f.write("Kd 1.0 1.0 1.0\n")
            f.write("Ks 0.0 0.0 0.0\n")
            f.write(f"map_Kd {texture_name}\n\n")
            
            # Tree material (simple green)
            f.write("newmtl tree_material\n")
            f.write("Ka 0.2 0.5 0.2\n")
            f.write("Kd 0.3 0.7 0.3\n")
            f.write("Ks 0.1 0.1 0.1\n")
            
    def run(self):
        """Start the application."""
        self.root.mainloop()

if __name__ == "__main__":
    app = TreeModelGenerator()
    app.run()
