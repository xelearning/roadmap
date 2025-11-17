# Roadmap Editor

A dynamic, interactive roadmap editor built with **SVG, HTML, CSS, and JavaScript**. This tool allows users to create, edit, and visualize hierarchical nodes (roots, categories, subcategories, dashed nodes, circles) with connections, making it ideal for planning, learning paths, or visual project mapping.

---

## Features

### 1. Node Types
- **Root**: The top-level node. Can have categories as children.
- **Category**: Connects to roots and can have subcategories.
- **Subcategory**: Connects to categories.
- **Dashed Node**: Rectangular node with dashed borders and customizable background color.
- **Circle Node**: Circular node with customizable color and stroke.

### 2. Node Interactions
- **Add Nodes**: Click on the canvas with a selected tool to add a new node at that position.
  - Toolbar includes buttons for each node type (`Add Root`, `Add Category`, `Add Sub`, `Dashed`, `Circle`).
- **Select Node**: Click a node to select it.
- **Drag Node**: Click and drag to reposition nodes.
- **Connect Nodes**: Use the `Connect` tool to link nodes.
- **Disconnect Nodes**: Use the `Disconnect` tool to remove connections.
- **Delete Node**: Use the `Delete` tool to remove a node and its connections.

### 3. Styling & Appearance
- **Dynamic Node Size**: Width and height adjust automatically based on label text.
- **Dashed Nodes**:
  - Background color configurable.
  - Dashed border with adjustable dash/gap.
  - Padding between text and border.
- **Circle Nodes**: Customizable radius, fill, and stroke.
- **Text Labels**:
  - Multi-line support.
  - Automatic line wrapping based on max characters per node type.
  - Font size varies by node type.

### 4. Canvas Interactions
- **Zoom**: Mouse wheel to zoom in/out while keeping focus on cursor position.
- **Pan**: Click and drag empty canvas space to move the view.
- **Responsive SVG**: Nodes, connections, and hub lines adapt dynamically to canvas transformations.

### 5. Connections
- Lines connecting nodes are dynamically drawn:
  - Straight lines for root → category connections.
  - L-shaped lines for other connections.
- Selected nodes highlight connections and increase stroke width.
- Hub lines show vertical alignment between roots and categories.

### 6. Details Panel
- Shows selected node's information:
  - Label, URL, Description.
- Allows editing and saving directly to the node.
- Real-time update reflected on canvas.

### 7. Save / Output
- Export the full roadmap as JSON.
- Copy to clipboard or download as `.json` file.
- Saved output includes nodes and connections for future loading.

### 8. Toolbar
- **Tool Selection**: Switch between adding nodes, connecting, disconnecting, deleting, and editing.
- **Active Tool Highlight**: Currently selected tool is visually highlighted.

### 9. Additional Functionalities
- **Dynamic Root List**: Sidebar shows all root nodes and allows quick selection.
- **Node Highlighting**: Active or selected nodes and connections are highlighted for clarity.
- **Undo / Redo**: (Optional: implementable if required for advanced roadmap editing.)

---

## Getting Started

1. **Clone Repository**
   ```bash
   git clone <repo-url>
