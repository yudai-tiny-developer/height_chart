# Height Chart Generator

A web application that generates highly customizable height comparison charts from character images and CSV data. It runs completely locally in your browser.

## Features

- **Drag and Drop Interface**: Easily drop your CSV file and PNG character images to generate the chart.
- **Background Grid**: Displays a height scale background grid (configurable in `cm` or `feet/inches`).
- **Customizable Layout**: Adjust margins and spaces between characters directly from the settings panel.
- **Flexible Data Entry**: Enter character heights in centimeters (e.g., `175`) or feet/inches (e.g., `5'7"`).
- **Multi-language Support**: Toggle between English and Japanese interfaces.
- **Export to PNG**: Download the generated height chart as a high-quality PNG image.

## How to Use

1. **Open the App**: Open `index.html` in your web browser.
2. **Provide Character Images**: Drag and drop the PNG images of your characters into the "Images" drop zone.
3. **Provide CSV Data**: Paste CSV data or drop a `.csv` file into the "CSV Data" area. 
   
   The CSV must contain the following columns (headers are optional, but order matters):
   `Filename, Height, TopY, BottomY, LeftX, RightX`
   
   - `Filename`: The exact filename of the dropped PNG (e.g., `hero.png`).
   - `Height`: Character height (e.g., `175` or `5'7"`).
   - `TopY`: Y-coordinate of the character's top (head).
   - `BottomY`: Y-coordinate of the character's bottom (feet).
   - `LeftX`: X-coordinate of the left side of the character's face/body.
   - `RightX`: X-coordinate of the right side of the character's face/body.
   
   *Example:*
   ```csv
   character.png, 160, 50, 1800, 200, 300
   another.png, 5'7", 40, 1850, 210, 310
   ```

4. **Adjust Settings**: 
   - Set `Character Spacing`, `Top Margin`, and `Bottom Margin`.
   - Toggle the unit between `cm` and `ft / in`.
   - Enable/disable the background grid and height text labels.
   
5. **Generate & Download**: Click "Generate Chart" to render the images on the canvas. You can zoom in/out with the scroll wheel and drag to pan. Click "Download PNG" to save the chart.

## Setup & Local Development

No build process is required! The project uses pure HTML, CSS, and vanilla JavaScript. Simply clone the repository and open `index.html` in any modern web browser.
