# 9-Slicer: Nine-Slice Image Scaling Tool

A web-based tool for creating and previewing nine-slice scaled images. Nine-slice scaling (also known as 9-patch) is a technique used in UI development to create resizable graphics that maintain their border integrity.

## Features

- Interactive guide manipulation for setting slice regions
- Real-time preview of scaled results
- Adjustable output dimensions
- Zoom controls for precise editing
- Download processed images
- Support for various image formats
- Responsive design for desktop and mobile

## Getting Started

First, install the dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to use the tool.

## How to Use

1. Upload an image using the "Select image" button
2. Drag the red guide lines to set the stretchable regions
3. Adjust the output dimensions as needed
4. Use the zoom slider for precise control
5. Download the processed image using the "Save image" button

## Built With

- [Next.js](https://nextjs.org/) - React framework
- [TailwindCSS](https://tailwindcss.com/) - Styling
- [Radix UI](https://www.radix-ui.com/) - UI Components
- [FileSaver.js](https://github.com/eligrey/FileSaver.js) - Client-side file saving

## Live Demo

Try it out at: [9slicer.netlify.app](https://9slicer.netlify.app)

## Development

To contribute to this project:

```bash
# Clone the repository
git clone https://github.com/ajayveyron/9slicer.git

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## License

MIT License - feel free to use this project for any purpose.
