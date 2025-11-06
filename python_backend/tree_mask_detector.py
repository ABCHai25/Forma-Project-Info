import numpy as np
import json
import cv2
import tkinter as tk
from tkinter import filedialog, messagebox
from PIL import Image, ImageTk
import math
import os
from datetime import datetime

class TreeMaskDetector:
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("Tree Mask Detector")
        self.root.geometry("1400x800")
        
        # Data variables
        self.original_image = None
        self.image_path = None
        self.hsv_image = None
        self.mask = None
        
        # HSV color range (default for green vegetation)
        self.lower_color = np.array([25, 40, 40])
        self.upper_color = np.array([99, 255, 70])
        
        # Scale variables (meters)
        self.real_width = tk.DoubleVar(value=0.0)
        self.real_height = tk.DoubleVar(value=0.0)
        
        # Detection parameters
        self.min_tree_diameter = tk.DoubleVar(value=2.0)  # Minimum 2m
        self.max_tree_diameter = tk.DoubleVar(value=15.0)  # Maximum 15m
        self.cluster_threshold = tk.DoubleVar(value=15.0)  # Cluster if > 15m diameter circle
        
        # HSV sliders variables
        self.hue_min = tk.IntVar(value=self.lower_color[0])
        self.sat_min = tk.IntVar(value=self.lower_color[1])
        self.val_min = tk.IntVar(value=self.lower_color[2])
        self.hue_max = tk.IntVar(value=self.upper_color[0])
        self.sat_max = tk.IntVar(value=self.upper_color[1])
        self.val_max = tk.IntVar(value=self.upper_color[2])
        
        self.create_ui()
        
    def create_ui(self):
        """Create the main user interface."""
        # Top controls frame
        control_frame = tk.Frame(self.root, bg='#2c3e50', padx=10, pady=10)
        control_frame.pack(side=tk.TOP, fill=tk.X)
        
        # Load image button
        tk.Button(
            control_frame,
            text="Load Image",
            command=self.load_image,
            bg='#3498db',
            fg='white',
            font=('Arial', 10, 'bold'),
            padx=20,
            pady=5
        ).pack(side=tk.LEFT, padx=5)
        
        # Process button
        self.process_btn = tk.Button(
            control_frame,
            text="Process & Export",
            command=self.process_and_export,
            bg='#27ae60',
            fg='white',
            font=('Arial', 10, 'bold'),
            padx=20,
            pady=5,
            state=tk.DISABLED
        )
        self.process_btn.pack(side=tk.LEFT, padx=5)
        
        # Status label
        self.status_label = tk.Label(
            control_frame,
            text="Please load an image to begin",
            bg='#2c3e50',
            fg='#ecf0f1',
            font=('Arial', 10)
        )
        self.status_label.pack(side=tk.LEFT, padx=20)
        
        # Main content area
        main_frame = tk.Frame(self.root)
        main_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # Left side: Image previews
        preview_frame = tk.Frame(main_frame, bg='#34495e')
        preview_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=(0, 10))
        
        # Original image preview
        original_label = tk.Label(preview_frame, text="Original Image", bg='#34495e', fg='white', font=('Arial', 11, 'bold'))
        original_label.pack(pady=(10, 5))
        
        self.original_preview = tk.Label(preview_frame, bg='black')
        self.original_preview.pack(padx=10, pady=5, fill=tk.BOTH, expand=True)
        
        # Mask preview
        mask_label = tk.Label(preview_frame, text="Tree Mask Preview", bg='#34495e', fg='white', font=('Arial', 11, 'bold'))
        mask_label.pack(pady=(10, 5))
        
        self.mask_preview = tk.Label(preview_frame, bg='black')
        self.mask_preview.pack(padx=10, pady=5, fill=tk.BOTH, expand=True)
        
        # Right side: Controls
        settings_frame = tk.Frame(main_frame, bg='#ecf0f1', width=400)
        settings_frame.pack(side=tk.RIGHT, fill=tk.Y)
        settings_frame.pack_propagate(False)
        
        # Scrollable settings
        canvas = tk.Canvas(settings_frame, bg='#ecf0f1', highlightthickness=0)
        scrollbar = tk.Scrollbar(settings_frame, orient="vertical", command=canvas.yview)
        scrollable_frame = tk.Frame(canvas, bg='#ecf0f1')
        
        scrollable_frame.bind(
            "<Configure>",
            lambda e: canvas.configure(scrollregion=canvas.bbox("all"))
        )
        
        canvas.create_window((0, 0), window=scrollable_frame, anchor="nw")
        canvas.configure(yscrollcommand=scrollbar.set)
        
        canvas.pack(side="left", fill="both", expand=True)
        scrollbar.pack(side="right", fill="y")
        
        # === Image Scale Section ===
        scale_section = tk.LabelFrame(
            scrollable_frame,
            text="Real-World Image Dimensions",
            bg='#ecf0f1',
            font=('Arial', 10, 'bold'),
            padx=10,
            pady=10
        )
        scale_section.pack(fill=tk.X, padx=10, pady=10)
        
        tk.Label(scale_section, text="Width (meters):", bg='#ecf0f1').grid(row=0, column=0, sticky='w', pady=5)
        tk.Entry(scale_section, textvariable=self.real_width, width=10).grid(row=0, column=1, pady=5)
        
        tk.Label(scale_section, text="Height (meters):", bg='#ecf0f1').grid(row=1, column=0, sticky='w', pady=5)
        tk.Entry(scale_section, textvariable=self.real_height, width=10).grid(row=1, column=1, pady=5)
        
        # === HSV Color Range Section ===
        hsv_section = tk.LabelFrame(
            scrollable_frame,
            text="HSV Color Range for Trees",
            bg='#ecf0f1',
            font=('Arial', 10, 'bold'),
            padx=10,
            pady=10
        )
        hsv_section.pack(fill=tk.X, padx=10, pady=10)
        
        # Lower threshold
        tk.Label(hsv_section, text="Lower Threshold", bg='#ecf0f1', font=('Arial', 9, 'bold')).grid(row=0, column=0, columnspan=2, pady=5)
        
        self.create_hsv_slider(hsv_section, "Hue Min:", self.hue_min, 0, 179, 1)
        self.create_hsv_slider(hsv_section, "Sat Min:", self.sat_min, 0, 255, 2)
        self.create_hsv_slider(hsv_section, "Val Min:", self.val_min, 0, 255, 3)
        
        # Upper threshold
        tk.Label(hsv_section, text="Upper Threshold", bg='#ecf0f1', font=('Arial', 9, 'bold')).grid(row=4, column=0, columnspan=2, pady=(15, 5))
        
        self.create_hsv_slider(hsv_section, "Hue Max:", self.hue_max, 0, 179, 5)
        self.create_hsv_slider(hsv_section, "Sat Max:", self.sat_max, 0, 255, 6)
        self.create_hsv_slider(hsv_section, "Val Max:", self.val_max, 0, 255, 7)
        
        # === Detection Parameters Section ===
        detection_section = tk.LabelFrame(
            scrollable_frame,
            text="Detection Parameters",
            bg='#ecf0f1',
            font=('Arial', 10, 'bold'),
            padx=10,
            pady=10
        )
        detection_section.pack(fill=tk.X, padx=10, pady=10)
        
        tk.Label(detection_section, text="Min Tree Diameter (m):", bg='#ecf0f1').grid(row=0, column=0, sticky='w', pady=5)
        tk.Entry(detection_section, textvariable=self.min_tree_diameter, width=10).grid(row=0, column=1, pady=5)
        
        tk.Label(detection_section, text="Max Tree Diameter (m):", bg='#ecf0f1').grid(row=1, column=0, sticky='w', pady=5)
        tk.Entry(detection_section, textvariable=self.max_tree_diameter, width=10).grid(row=1, column=1, pady=5)
        
        tk.Label(detection_section, text="Cluster Threshold (m):", bg='#ecf0f1').grid(row=2, column=0, sticky='w', pady=5)
        tk.Entry(detection_section, textvariable=self.cluster_threshold, width=10).grid(row=2, column=1, pady=5)
        
        tk.Label(
            detection_section,
            text="(Circles larger than this are treated as tree clusters)",
            bg='#ecf0f1',
            font=('Arial', 8),
            fg='#7f8c8d'
        ).grid(row=3, column=0, columnspan=2, sticky='w')
        
    def create_hsv_slider(self, parent, label, variable, from_, to_, row):
        """Create an HSV slider with label and value display."""
        tk.Label(parent, text=label, bg='#ecf0f1').grid(row=row, column=0, sticky='w', pady=2)
        
        value_label = tk.Label(parent, text=str(variable.get()), bg='#ecf0f1', width=5)
        value_label.grid(row=row, column=2, padx=5)
        
        def on_change(val):
            value_label.config(text=str(int(float(val))))
            self.update_mask_preview()
        
        slider = tk.Scale(
            parent,
            from_=from_,
            to=to_,
            orient=tk.HORIZONTAL,
            variable=variable,
            command=on_change,
            bg='#ecf0f1',
            highlightthickness=0
        )
        slider.grid(row=row, column=1, sticky='ew', pady=2)
        
    def load_image(self):
        """Load an image file."""
        file_path = filedialog.askopenfilename(
            title="Select Image",
            filetypes=[
                ("Image files", "*.jpg *.jpeg *.png *.bmp *.tif *.tiff"),
                ("All files", "*.*")
            ]
        )
        
        if not file_path:
            return
            
        try:
            self.image_path = file_path
            self.original_image = cv2.imread(file_path)
            
            if self.original_image is None:
                raise ValueError("Failed to load image")
            
            # Convert to RGB for display
            self.original_image = cv2.cvtColor(self.original_image, cv2.COLOR_BGR2RGB)
            self.hsv_image = cv2.cvtColor(self.original_image, cv2.COLOR_RGB2HSV)
            
            # Update previews
            self.update_image_previews()
            self.update_mask_preview()
            
            self.process_btn.config(state=tk.NORMAL)
            self.status_label.config(text=f"Image loaded: {os.path.basename(file_path)}")
            
        except Exception as e:
            messagebox.showerror("Error", f"Failed to load image: {str(e)}")
            self.status_label.config(text="Error loading image")
    
    def update_image_previews(self):
        """Update the original image preview."""
        if self.original_image is None:
            return
        
        # Resize for display (max 600x400)
        display_img = self.resize_for_display(self.original_image, 600, 400)
        img_tk = ImageTk.PhotoImage(Image.fromarray(display_img))
        
        self.original_preview.config(image=img_tk)
        self.original_preview.image = img_tk
    
    def update_mask_preview(self):
        """Update the mask preview based on current HSV values."""
        if self.hsv_image is None:
            return
        
        # Get current HSV values
        lower = np.array([self.hue_min.get(), self.sat_min.get(), self.val_min.get()])
        upper = np.array([self.hue_max.get(), self.sat_max.get(), self.val_max.get()])
        
        # Create mask
        self.mask = cv2.inRange(self.hsv_image, lower, upper)
        
        # Clean up mask
        kernel = np.ones((5, 5), np.uint8)
        self.mask = cv2.morphologyEx(self.mask, cv2.MORPH_CLOSE, kernel)
        self.mask = cv2.morphologyEx(self.mask, cv2.MORPH_OPEN, kernel)
        
        # Resize for display
        display_mask = self.resize_for_display(self.mask, 600, 400)
        img_tk = ImageTk.PhotoImage(Image.fromarray(display_mask))
        
        self.mask_preview.config(image=img_tk)
        self.mask_preview.image = img_tk
    
    def resize_for_display(self, image, max_width, max_height):
        """Resize image to fit within display bounds while maintaining aspect ratio."""
        height, width = image.shape[:2]
        
        scale = min(max_width / width, max_height / height)
        
        if scale < 1:
            new_width = int(width * scale)
            new_height = int(height * scale)
            return cv2.resize(image, (new_width, new_height), interpolation=cv2.INTER_AREA)
        
        return image
    
    def process_and_export(self):
        """Process the image and export results."""
        if self.original_image is None or self.mask is None:
            messagebox.showwarning("Warning", "Please load an image first")
            return
        
        # Validate inputs
        if self.real_width.get() <= 0 or self.real_height.get() <= 0:
            messagebox.showwarning("Warning", "Please enter valid real-world dimensions")
            return
        
        self.status_label.config(text="Processing...")
        self.root.update()
        
        try:
            # Calculate meters per pixel
            img_height, img_width = self.original_image.shape[:2]
            meters_per_pixel_x = self.real_width.get() / img_width
            meters_per_pixel_y = self.real_height.get() / img_height
            
            # Find contours (polygons)
            contours, _ = cv2.findContours(self.mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            # Calculate minimum area in pixels
            min_diameter_m = self.min_tree_diameter.get()
            min_radius_m = min_diameter_m / 2
            min_area_m2 = math.pi * (min_radius_m ** 2)
            min_area_pixels = min_area_m2 / (meters_per_pixel_x * meters_per_pixel_y)
            
            # Calculate cluster threshold in m²
            cluster_diameter_m = self.cluster_threshold.get()
            cluster_radius_m = cluster_diameter_m / 2
            cluster_area_m2 = math.pi * (cluster_radius_m ** 2)
            
            # Process contours
            individual_trees = []
            tree_clusters = []
            
            for contour in contours:
                area_pixels = cv2.contourArea(contour)
                
                if area_pixels < min_area_pixels:
                    continue
                
                # Convert to real-world area
                area_m2 = area_pixels * meters_per_pixel_x * meters_per_pixel_y
                
                # Get centroid
                M = cv2.moments(contour)
                if M["m00"] == 0:
                    continue
                
                cx_px = int(M["m10"] / M["m00"])
                cy_px = int(M["m01"] / M["m00"])
                cx_m = cx_px * meters_per_pixel_x
                cy_m = cy_px * meters_per_pixel_y
                
                # Get polygon points
                polygon_px = contour.reshape(-1, 2).tolist()
                polygon_m = [[p[0] * meters_per_pixel_x, p[1] * meters_per_pixel_y] for p in polygon_px]
                
                if area_m2 > cluster_area_m2:
                    # This is a tree cluster - populate with multiple trees
                    populated_trees = self.populate_cluster(
                        contour,
                        area_m2,
                        meters_per_pixel_x,
                        meters_per_pixel_y
                    )
                    
                    tree_clusters.append({
                        "type": "cluster",
                        "area_m2": round(area_m2, 2),
                        "centroid_px": [cx_px, cy_px],
                        "centroid_m": [round(cx_m, 2), round(cy_m, 2)],
                        "polygon_px": polygon_px,
                        "polygon_m": [[round(p[0], 2), round(p[1], 2)] for p in polygon_m],
                        "populated_trees": populated_trees
                    })
                else:
                    # Individual tree
                    # Estimate diameter from area
                    estimated_diameter_m = 2 * math.sqrt(area_m2 / math.pi)
                    
                    individual_trees.append({
                        "type": "individual",
                        "centroid_px": [cx_px, cy_px],
                        "centroid_m": [round(cx_m, 2), round(cy_m, 2)],
                        "area_m2": round(area_m2, 2),
                        "estimated_diameter_m": round(estimated_diameter_m, 2),
                        "polygon_px": polygon_px,
                        "polygon_m": [[round(p[0], 2), round(p[1], 2)] for p in polygon_m]
                    })
            
            # Create output image with overlays
            output_image = self.create_output_image(individual_trees, tree_clusters, meters_per_pixel_x, meters_per_pixel_y)
            
            # Create JSON output
            json_output = {
                "metadata": {
                    "timestamp": datetime.now().isoformat(),
                    "source_image": os.path.basename(self.image_path),
                    "image_dimensions_px": {"width": img_width, "height": img_height},
                    "real_dimensions_m": {"width": self.real_width.get(), "height": self.real_height.get()},
                    "meters_per_pixel": {"x": round(meters_per_pixel_x, 6), "y": round(meters_per_pixel_y, 6)},
                    "hsv_range": {
                        "lower": [self.hue_min.get(), self.sat_min.get(), self.val_min.get()],
                        "upper": [self.hue_max.get(), self.sat_max.get(), self.val_max.get()]
                    },
                    "detection_parameters": {
                        "min_tree_diameter_m": self.min_tree_diameter.get(),
                        "max_tree_diameter_m": self.max_tree_diameter.get(),
                        "cluster_threshold_m": self.cluster_threshold.get()
                    }
                },
                "summary": {
                    "individual_trees_count": len(individual_trees),
                    "tree_clusters_count": len(tree_clusters),
                    "total_populated_trees": sum(len(c["populated_trees"]) for c in tree_clusters)
                },
                "individual_trees": individual_trees,
                "tree_clusters": tree_clusters
            }
            
            # Save files
            self.save_outputs(output_image, json_output)
            
            # Update status with tree count
            total_trees = len(individual_trees) + sum(len(c["populated_trees"]) for c in tree_clusters)
            self.status_label.config(text=f"Detection complete! Total trees: {total_trees}")
            
        except Exception as e:
            messagebox.showerror("Error", f"Processing failed: {str(e)}")
            self.status_label.config(text="Processing failed")
    
    def populate_cluster(self, contour, area_m2, meters_per_pixel_x, meters_per_pixel_y):
        """Populate a tree cluster with individual tree positions."""
        populated_trees = []
        
        # Get bounding rectangle
        x, y, w, h = cv2.boundingRect(contour)
        
        # Estimate number of trees based on area and average tree size
        avg_tree_diameter = (self.min_tree_diameter.get() + self.max_tree_diameter.get()) / 2
        avg_tree_area = math.pi * (avg_tree_diameter / 2) ** 2
        estimated_tree_count = int(area_m2 / avg_tree_area)
        
        # Use Poisson disk sampling to distribute trees within the polygon
        # For simplicity, we'll use a grid-based approach
        min_spacing_m = self.min_tree_diameter.get()
        min_spacing_px = min_spacing_m / ((meters_per_pixel_x + meters_per_pixel_y) / 2)
        
        attempts = 0
        max_attempts = estimated_tree_count * 10
        
        while len(populated_trees) < estimated_tree_count and attempts < max_attempts:
            attempts += 1
            
            # Random point within bounding box
            test_x = np.random.randint(x, x + w)
            test_y = np.random.randint(y, y + h)
            
            # Check if point is inside contour
            if cv2.pointPolygonTest(contour, (test_x, test_y), False) < 0:
                continue
            
            # Check minimum spacing from existing trees
            too_close = False
            for tree in populated_trees:
                dist = math.sqrt((test_x - tree["position_px"][0])**2 + (test_y - tree["position_px"][1])**2)
                if dist < min_spacing_px:
                    too_close = True
                    break
            
            if too_close:
                continue
            
            # Add tree
            position_m = [test_x * meters_per_pixel_x, test_y * meters_per_pixel_y]
            diameter_m = np.random.uniform(self.min_tree_diameter.get(), self.max_tree_diameter.get())
            
            populated_trees.append({
                "position_px": [int(test_x), int(test_y)],
                "position_m": [round(position_m[0], 2), round(position_m[1], 2)],
                "estimated_diameter_m": round(diameter_m, 2)
            })
        
        return populated_trees
    
    def create_output_image(self, individual_trees, tree_clusters, meters_per_pixel_x, meters_per_pixel_y):
        """Create annotated output image."""
        output = self.original_image.copy()
        
        # Draw individual trees (green polygons with centroid)
        for tree in individual_trees:
            polygon = np.array(tree["polygon_px"], dtype=np.int32)
            cv2.polylines(output, [polygon], True, (0, 255, 0), 2)
            cx, cy = tree["centroid_px"]
            cv2.circle(output, (cx, cy), 5, (0, 255, 0), -1)
        
        # Draw tree clusters (red polygons with populated trees as blue circles)
        for cluster in tree_clusters:
            polygon = np.array(cluster["polygon_px"], dtype=np.int32)
            cv2.polylines(output, [polygon], True, (255, 0, 0), 2)
            
            # Draw populated trees
            for tree in cluster["populated_trees"]:
                px, py = tree["position_px"]
                diameter_m = tree["estimated_diameter_m"]
                radius_px = int((diameter_m / 2) / ((meters_per_pixel_x + meters_per_pixel_y) / 2))
                cv2.circle(output, (px, py), radius_px, (0, 150, 255), 2)
                cv2.circle(output, (px, py), 3, (0, 150, 255), -1)
        
        return output
    
    def save_outputs(self, output_image, json_output):
        """Save the output image and JSON file."""
        # Ask for save location
        file_path = filedialog.asksaveasfilename(
            defaultextension=".png",
            filetypes=[("PNG files", "*.png"), ("All files", "*.*")],
            title="Save Output Image"
        )
        
        if not file_path:
            self.status_label.config(text="Export cancelled")
            return
        
        # Save image
        output_bgr = cv2.cvtColor(output_image, cv2.COLOR_RGB2BGR)
        cv2.imwrite(file_path, output_bgr)
        
        # Save JSON (same name, .json extension)
        json_path = os.path.splitext(file_path)[0] + ".json"
        with open(json_path, 'w') as f:
            json.dump(json_output, f, indent=2)
        
        # Get tree count for success message
        total_trees = json_output["summary"]["individual_trees_count"] + json_output["summary"]["total_populated_trees"]
        
        self.status_label.config(text=f"Exported: {os.path.basename(file_path)} and {os.path.basename(json_path)}")
        messagebox.showinfo("Success", f"Files saved successfully!\n\n📊 Detection Results:\n• Total trees detected: {total_trees}\n• Individual trees: {json_output['summary']['individual_trees_count']}\n• Trees in clusters: {json_output['summary']['total_populated_trees']}\n\n📁 Files:\n{file_path}\n{json_path}")
    
    def run(self):
        """Start the application."""
        self.root.mainloop()

if __name__ == "__main__":
    app = TreeMaskDetector()
    app.run()
