"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { ImageIcon, Save, Mail } from "lucide-react";
import FileSaver from "file-saver";
import { CheckerboardBackground } from "@/components/checkerboard-background";
import {
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DEMO_IMAGES = [
  {
    id: 1,
    url: "https://i.ibb.co/DPKcPzQf/DALL-E-2025-02-02-22-37-07-A-simple-square-gold-frame-with-an-empty-transparent-like-center-The-fram.webp",
    thumbnail:
      "https://i.ibb.co/DPKcPzQf/DALL-E-2025-02-02-22-37-07-A-simple-square-gold-frame-with-an-empty-transparent-like-center-The-fram.webp",
    label: "Gold Frame",
  },
  {
    id: 2,
    url: "https://i.ibb.co/ZR1DPX4P/DALL-E-2025-02-02-20-30-15-A-gold-user-avatar-profile-frame-for-a-game-with-a-squarish-shape-and-a-b.webp",
    thumbnail:
      "https://i.ibb.co/ZR1DPX4P/DALL-E-2025-02-02-20-30-15-A-gold-user-avatar-profile-frame-for-a-game-with-a-squarish-shape-and-a-b.webp",
    label: "Silver Frame",
  },
  {
    id: 3,
    url: "https://i.ibb.co/Gv3GrGgw/5b4d13cc-7e5a-49c6-8b64-4e3ccf631155-1.webp",
    thumbnail:
      "https://i.ibb.co/Gv3GrGgw/5b4d13cc-7e5a-49c6-8b64-4e3ccf631155-1.webp",
    label: "Button Frame",
  },
  {
    id: 4,
    url: "https://i.ibb.co/7LXCnsp/DALL-E-2025-02-02-22-45-05-A-simple-square-gold-frame-for-a-game-with-an-empty-transparent-like-cent.webp",
    thumbnail:
      "https://i.ibb.co/7LXCnsp/DALL-E-2025-02-02-22-45-05-A-simple-square-gold-frame-for-a-game-with-an-empty-transparent-like-cent.webp",
    label: "Panel Frame",
  },
];

// Add this helper function at the top level
function calculateContainedSize(
  originalWidth: number,
  originalHeight: number,
  containerWidth: number,
  containerHeight: number
) {
  const ratio = Math.min(
    containerWidth / originalWidth,
    containerHeight / originalHeight
  );
  return {
    width: Math.round(originalWidth * ratio),
    height: Math.round(originalHeight * ratio),
  };
}

// Add this helper function
const measureText = (
  text: string,
  fontSize: number,
  fontFamily: string,
  padding: number
): { width: number; height: number } => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return { width: 0, height: 0 };

  ctx.font = `${fontSize}px ${fontFamily}`;
  const metrics = ctx.measureText(text);

  return {
    width: Math.ceil(metrics.width + padding * 2),
    height: Math.ceil(fontSize + padding * 2),
  };
};

// Add this after the imports
const VERSION_HISTORY = {
  current: "v2.0",
  changes: [
    {
      version: "v2.0",
      date: "2024-02-03",
      features: [
        "Added text auto-sizing mode",
        "Added demo images gallery",
        "Added font styling options",
        "Improved preview rendering",
      ],
    },
    {
      version: "v1.0",
      date: "2024-02-02",
      features: [
        "Initial release",
        "Basic 9-slice scaling",
        "Manual size controls",
        "Guide adjustments",
      ],
    },
  ],
};

export default function NineSliceTool() {
  // State management for the image and its properties
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [sliceSettings, setSliceSettings] = useState({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  });
  const [outputSize, setOutputSize] = useState({ width: 300, height: 300 });
  const [pendingOutputSize, setPendingOutputSize] = useState({
    width: 300,
    height: 300,
  });
  const [zoom, setZoom] = useState(100);
  const [showGuides, setShowGuides] = useState(true);

  // Track which edge is being dragged for interactive resizing
  const [isDragging, setIsDragging] = useState<
    keyof typeof sliceSettings | null
  >(null);

  // References to canvas elements for original and processed images
  const originalCanvasRef = useRef<HTMLCanvasElement>(null);
  const slicedCanvasRef = useRef<HTMLCanvasElement>(null);

  // Add new state for preview dimensions
  const [previewDimensions, setPreviewDimensions] = useState({
    width: 0,
    height: 0,
  });

  // Change the drag and drop state name to avoid conflict
  const [isDraggingFile, setIsDraggingFile] = useState(false); // For drag and drop

  // Add these new states after other state declarations
  const [centerText, setCenterText] = useState("");
  const [textStyle, setTextStyle] = useState({
    fontSize: 16,
    color: "#FFFFFF",
    fontFamily: "Inter",
    fontWeight: 400,
    isItalic: false,
    lineHeight: 1.5,
    letterSpacing: 0,
    padding: 16,
  });

  // Add available fonts
  const fontOptions = [
    { label: "Inter", value: "Inter" },
    { label: "Roboto", value: "Roboto" },
    { label: "Playfair Display", value: "Playfair_Display" },
    { label: "Open Sans", value: "Open_Sans" },
  ];

  // Add font weights
  const fontWeights = [
    { label: "Regular", value: 400 },
    { label: "Medium", value: 500 },
    { label: "Semi Bold", value: 600 },
    { label: "Bold", value: 700 },
  ];

  // Add new state for mode toggle
  const [sizeMode, setSizeMode] = useState<"manual" | "text">("manual");

  // Handles image file upload and initialization
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          setImage(img);
          // Initialize slice settings to 30% of image dimensions
          setSliceSettings({
            top: Math.round(img.height * 0.33),
            right: Math.round(img.width * 0.33),
            bottom: Math.round(img.height * 0.33),
            left: Math.round(img.width * 0.33),
          });
          setOutputSize({ width: img.width, height: img.height });
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  // Updates individual slice settings (top, right, bottom, left)
  const handleSliceSettingChange = (
    setting: keyof typeof sliceSettings,
    value: number
  ) => {
    setSliceSettings((prev) => ({ ...prev, [setting]: value }));
  };

  // Updates output dimensions
  const handleOutputSizeChange = (
    dimension: "width" | "height",
    value: number
  ) => {
    setPendingOutputSize((prev) => ({ ...prev, [dimension]: value }));
  };

  // Update the output size only on blur
  const handleOutputSizeBlur = () => {
    setOutputSize(pendingOutputSize);
  };

  // Add this handler for key press
  const handleOutputSizeKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
      handleOutputSizeBlur();
    }
  };

  // Draws guide lines on the canvas to show slice regions
  const drawGuides = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) => {
    if (!showGuides) return;

    const { top, right, bottom, left } = sliceSettings;
    ctx.strokeStyle = "rgba(255, 0, 0, 0.5)";
    ctx.lineWidth = 3;
    ctx.setLineDash([5, 5]);

    // Draw vertical guide lines
    ctx.beginPath();
    ctx.moveTo(left, 0);
    ctx.lineTo(left, height);
    ctx.moveTo(width - right, 0);
    ctx.lineTo(width - right, height);
    ctx.stroke();

    // Draw horizontal guide lines
    ctx.beginPath();
    ctx.moveTo(0, top);
    ctx.lineTo(width, top);
    ctx.moveTo(0, height - bottom);
    ctx.lineTo(width, height - bottom);
    ctx.stroke();
  };

  // Core function that applies the 9-slice scaling
  const applyNineSlice = () => {
    if (!image || !originalCanvasRef.current || !slicedCanvasRef.current)
      return;

    const originalCanvas = originalCanvasRef.current;
    const slicedCanvas = slicedCanvasRef.current;
    const originalCtx = originalCanvas.getContext("2d");
    const slicedCtx = slicedCanvas.getContext("2d");
    if (!originalCtx || !slicedCtx) return;

    // Set original canvas dimensions
    originalCanvas.width = image.width;
    originalCanvas.height = image.height;

    // Draw original image and guides
    originalCtx.drawImage(image, 0, 0);

    // Only draw guides on the original canvas
    if (showGuides) {
      drawGuides(originalCtx, image.width, image.height);
    }

    // Calculate contained dimensions for preview
    const previewContainer = slicedCanvas.parentElement;
    if (previewContainer) {
      const contained = calculateContainedSize(
        outputSize.width,
        outputSize.height,
        previewContainer.clientWidth,
        previewContainer.clientHeight
      );
      setPreviewDimensions(contained);

      // Set preview canvas size
      slicedCanvas.width = outputSize.width;
      slicedCanvas.height = outputSize.height;
      slicedCanvas.style.width = `${contained.width}px`;
      slicedCanvas.style.height = `${contained.height}px`;
    }

    const { top, right, bottom, left } = sliceSettings;
    const centerWidth = image.width - left - right;
    const centerHeight = image.height - top - bottom;

    // Draw the nine slices in the following order:
    // 1. Corner pieces (4)
    // 2. Edge pieces (4)
    // 3. Center piece (1)

    // Draw corners (top-left, top-right, bottom-left, bottom-right)
    slicedCtx.drawImage(image, 0, 0, left, top, 0, 0, left, top);
    slicedCtx.drawImage(
      image,
      image.width - right,
      0,
      right,
      top,
      slicedCanvas.width - right,
      0,
      right,
      top
    );
    slicedCtx.drawImage(
      image,
      0,
      image.height - bottom,
      left,
      bottom,
      0,
      slicedCanvas.height - bottom,
      left,
      bottom
    );
    slicedCtx.drawImage(
      image,
      image.width - right,
      image.height - bottom,
      right,
      bottom,
      slicedCanvas.width - right,
      slicedCanvas.height - bottom,
      right,
      bottom
    );

    // Draw edges (top, bottom, left, right)
    slicedCtx.drawImage(
      image,
      left,
      0,
      centerWidth,
      top,
      left,
      0,
      slicedCanvas.width - left - right,
      top
    );
    slicedCtx.drawImage(
      image,
      left,
      image.height - bottom,
      centerWidth,
      bottom,
      left,
      slicedCanvas.height - bottom,
      slicedCanvas.width - left - right,
      bottom
    );
    slicedCtx.drawImage(
      image,
      0,
      top,
      left,
      centerHeight,
      0,
      top,
      left,
      slicedCanvas.height - top - bottom
    );
    slicedCtx.drawImage(
      image,
      image.width - right,
      top,
      right,
      centerHeight,
      slicedCanvas.width - right,
      top,
      right,
      slicedCanvas.height - top - bottom
    );

    // Draw center piece
    slicedCtx.drawImage(
      image,
      left,
      top,
      centerWidth,
      centerHeight,
      left,
      top,
      slicedCanvas.width - left - right,
      slicedCanvas.height - top - bottom
    );

    if (centerText) {
      // Set up text styling
      const fontStyle = textStyle.isItalic ? "italic" : "normal";
      slicedCtx.font = `${fontStyle} ${textStyle.fontWeight} ${textStyle.fontSize}px ${textStyle.fontFamily}`;
      slicedCtx.fillStyle = textStyle.color;
      slicedCtx.textAlign = "center";
      slicedCtx.textBaseline = "middle";
      slicedCtx.letterSpacing = `${textStyle.letterSpacing}px`;

      // Calculate center position
      const centerX = left + (slicedCanvas.width - left - right) / 2;
      const centerY = top + (slicedCanvas.height - top - bottom) / 2;

      // Draw text with line height
      const lines = centerText.split("\n");
      const lineHeightPx = textStyle.fontSize * textStyle.lineHeight;
      const totalHeight = lines.length * lineHeightPx;
      const startY = centerY - totalHeight / 2 + lineHeightPx / 2;

      lines.forEach((line, index) => {
        slicedCtx.fillText(line, centerX, startY + index * lineHeightPx);
      });
    }
  };

  // Modify the useEffect that calls applyNineSlice
  useEffect(() => {
    if (image) {
      applyNineSlice();
    }
  }, [
    image,
    sliceSettings,
    outputSize,
    showGuides,
    // Add these new dependencies
    centerText,
    textStyle,
    zoom,
    sizeMode,
  ]);

  // Add reset guides function
  const resetGuides = () => {
    if (!image) return;
    setSliceSettings({
      top: Math.round(image.height * 0.33),
      right: Math.round(image.width * 0.33),
      bottom: Math.round(image.height * 0.33),
      left: Math.round(image.width * 0.33),
    });
  };

  // Update the handlers to use the new name
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          setImage(img);
          setSliceSettings({
            top: Math.round(img.height * 0.33),
            right: Math.round(img.width * 0.33),
            bottom: Math.round(img.height * 0.33),
            left: Math.round(img.width * 0.33),
          });
          setOutputSize({ width: img.width, height: img.height });
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  // Modify handleDownload for custom filename
  const handleDownload = () => {
    if (slicedCanvasRef.current) {
      slicedCanvasRef.current.toBlob((blob) => {
        if (blob) {
          const originalName =
            image?.src.split("/").pop()?.split(".")[0] || "image";
          const fileName = `${originalName}-sliced-${outputSize.width}x${outputSize.height}.png`;
          FileSaver.saveAs(blob, fileName);
        }
      });
    }
  };

  // Interactive guide manipulation handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!image || !originalCanvasRef.current) return;

    const canvas = originalCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (image.width / rect.width);
    const y = (e.clientY - rect.top) * (image.height / rect.height);

    const { top, right, bottom, left } = sliceSettings;
    const threshold = 10; // pixels

    if (Math.abs(x - left) < threshold) setIsDragging("left");
    else if (Math.abs(x - (image.width - right)) < threshold)
      setIsDragging("right");
    else if (Math.abs(y - top) < threshold) setIsDragging("top");
    else if (Math.abs(y - (image.height - bottom)) < threshold)
      setIsDragging("bottom");
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !image || !originalCanvasRef.current) return;

    const canvas = originalCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (image.width / rect.width);
    const y = (e.clientY - rect.top) * (image.height / rect.height);

    setSliceSettings((prev) => {
      const newSettings = { ...prev };
      if (isDragging === "left")
        newSettings.left = Math.max(0, Math.min(x, image.width - prev.right));
      if (isDragging === "right")
        newSettings.right = Math.max(
          0,
          Math.min(image.width - x, image.width - prev.left)
        );
      if (isDragging === "top")
        newSettings.top = Math.max(0, Math.min(y, image.height - prev.bottom));
      if (isDragging === "bottom")
        newSettings.bottom = Math.max(
          0,
          Math.min(image.height - y, image.height - prev.top)
        );
      return newSettings;
    });
  };

  const handleMouseUp = () => {
    setIsDragging(null);
  };

  // Add this new function to load an image from URL
  const loadImageFromUrl = (url: string) => {
    const img = new Image();
    img.crossOrigin = "anonymous"; // Enable CORS
    img.onload = () => {
      setImage(img);
      setSliceSettings({
        top: Math.round(img.height * 0.33),
        right: Math.round(img.width * 0.33),
        bottom: Math.round(img.height * 0.33),
        left: Math.round(img.width * 0.33),
      });
      setOutputSize({ width: img.width, height: img.height });
    };
    img.src = url;
  };

  // Load default image on component mount
  useEffect(() => {
    if (!image) {
      loadImageFromUrl(DEMO_IMAGES[0].url);
    }
  }, []);

  return (
    <TooltipProvider>
      <div
        className="flex flex-col md:flex-row h-screen bg-zinc-950 text-zinc-100"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Version Badge */}
        <div className="absolute top-2 right-2 z-10">
          <TooltipRoot>
            <TooltipTrigger asChild>
              <div className="px-2 py-1 text-xs bg-zinc-800 rounded-full text-zinc-400 hover:bg-zinc-700 cursor-help">
                {VERSION_HISTORY.current}
              </div>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-xs">
              <div className="space-y-2">
                <p className="font-medium">
                  What's New in {VERSION_HISTORY.current}
                </p>
                <ul className="text-xs space-y-1 list-disc pl-4">
                  {VERSION_HISTORY.changes[0].features.map((feature, i) => (
                    <li key={i}>{feature}</li>
                  ))}
                </ul>
              </div>
            </TooltipContent>
          </TooltipRoot>
        </div>

        {/* Left Sidebar */}
        <div className="w-full md:w-72 border-b md:border-b-0 md:border-r border-zinc-800 p-4 flex flex-col">
          <div className="space-y-4 flex-1">
            <div className="space-y-2">
              <TooltipRoot>
                <TooltipTrigger asChild>
                  <Button
                    className="w-full mb-2"
                    onClick={() =>
                      document.getElementById("file-input")?.click()
                    }
                  >
                    <ImageIcon className="mr-2 h-4 w-4" />
                    Select image
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Click to select or drag and drop an image
                </TooltipContent>
              </TooltipRoot>

              {image && (
                <TooltipRoot>
                  <TooltipTrigger asChild>
                    <Button className="w-full mb-2" onClick={resetGuides}>
                      Reset guides
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Reset guides to default positions
                  </TooltipContent>
                </TooltipRoot>
              )}

              <TooltipRoot>
                <TooltipTrigger asChild>
                  <Button className="w-full" onClick={handleDownload}>
                    <Save className="mr-2 h-4 w-4" />
                    Save image
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Download the processed image</TooltipContent>
              </TooltipRoot>
            </div>

            <div className="space-y-4">
              <Label>Demo Images:</Label>
              <div className="grid grid-cols-4 gap-2">
                {DEMO_IMAGES.map((demo) => (
                  <TooltipRoot key={demo.id}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => loadImageFromUrl(demo.url)}
                        className={`relative aspect-square overflow-hidden rounded-lg border-2 transition-all ${
                          image?.src === demo.url
                            ? "border-blue-500"
                            : "border-zinc-800 hover:border-zinc-700"
                        }`}
                      >
                        <img
                          src={demo.thumbnail}
                          alt={demo.label}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>{demo.label}</TooltipContent>
                  </TooltipRoot>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Image name:</Label>
              <Input
                placeholder="image-9.png"
                className="bg-zinc-900 border-zinc-800 text-zinc-100"
              />
            </div>

            {image && (
              <>
                {/* Size Mode Toggle */}
                <div className="space-y-2">
                  <Label>Size Control Mode:</Label>
                  <div className="grid grid-cols-2 gap-2 bg-zinc-700/50 p-1 rounded-lg">
                    <Button
                      variant={sizeMode === "manual" ? "outline" : "default"}
                      onClick={() => {
                        setSizeMode("manual");
                        setCenterText(""); // Clear text when switching to manual
                      }}
                      className={`w-full ${
                        sizeMode === "manual" ? "text-zinc-950" : "text-zinc-50"
                      }`}
                    >
                      Manual
                    </Button>
                    <Button
                      variant={sizeMode === "text" ? "outline" : "default"}
                      onClick={() => {
                        setSizeMode("text");
                        if (!centerText) {
                          setCenterText("Player Name");
                        }
                      }}
                      className={`w-full ${
                        sizeMode === "text" ? "text-zinc-950" : "text-zinc-50"
                      }`}
                    >
                      Text Auto
                    </Button>
                  </div>
                </div>

                {/* Size Controls */}
                {sizeMode === "manual" ? (
                  <div className="space-y-4">
                    <Label>Manual Output Size:</Label>
                    {Object.entries(outputSize).map(([key, value]) => (
                      <div key={key} className="space-y-2">
                        <div className="flex justify-between">
                          <Label htmlFor={`output-${key}`}>
                            {key.charAt(0).toUpperCase() + key.slice(1)}
                          </Label>
                          <span className="text-sm text-zinc-400">
                            {value}px
                          </span>
                        </div>
                        <Input
                          id={`output-${key}`}
                          type="number"
                          value={
                            pendingOutputSize[key as keyof typeof outputSize]
                          }
                          className="bg-zinc-900 border-zinc-800 text-zinc-100"
                          onChange={(e) => {
                            setPendingOutputSize((prev) => ({
                              ...prev,
                              [key]: Number.parseInt(e.target.value) || 0,
                            }));
                            // Clear text when manually adjusting size
                            setCenterText("");
                          }}
                          onKeyDown={handleOutputSizeKeyDown}
                          onBlur={handleOutputSizeBlur}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Label>Text Auto-size:</Label>
                    <div className="space-y-2">
                      <textarea
                        value={centerText}
                        onChange={(e) => {
                          setCenterText(e.target.value);
                          if (e.target.value) {
                            // When text is entered, calculate and set new size
                            const { width, height } = measureText(
                              e.target.value,
                              textStyle.fontSize,
                              textStyle.fontFamily,
                              textStyle.padding
                            );

                            // Add padding for the non-stretchable areas
                            const newWidth =
                              width + sliceSettings.left + sliceSettings.right;
                            const newHeight =
                              height + sliceSettings.top + sliceSettings.bottom;

                            setOutputSize({
                              width: newWidth,
                              height: newHeight,
                            });
                            setPendingOutputSize({
                              width: newWidth,
                              height: newHeight,
                            });
                          }
                        }}
                        placeholder="Enter text to auto-size..."
                        className="bg-zinc-900 border-zinc-800 text-zinc-100 w-full min-h-[100px] rounded-md p-2"
                      />
                      <p className="text-xs text-zinc-400">
                        Enter text to automatically adjust the output size
                      </p>
                    </div>
                  </div>
                )}

                {sizeMode === "text" && (
                  <div className="space-y-4  border-zinc-800 pt-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label>Font Size</Label>
                          <span className="text-sm text-zinc-400">
                            {textStyle.fontSize}px
                          </span>
                        </div>
                        <Slider
                          value={[textStyle.fontSize]}
                          min={8}
                          max={72}
                          step={1}
                          onValueChange={([value]) => {
                            setTextStyle((prev) => ({
                              ...prev,
                              fontSize: value,
                            }));
                            if (centerText) {
                              // Recalculate size when font size changes
                              const { width, height } = measureText(
                                centerText,
                                value,
                                textStyle.fontFamily,
                                textStyle.padding
                              );
                              const newWidth =
                                width +
                                sliceSettings.left +
                                sliceSettings.right;
                              const newHeight =
                                height +
                                sliceSettings.top +
                                sliceSettings.bottom;

                              setOutputSize({
                                width: newWidth,
                                height: newHeight,
                              });
                              setPendingOutputSize({
                                width: newWidth,
                                height: newHeight,
                              });
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="space-y-4 pt-4 border-t border-zinc-800">
            <div className="flex items-center space-x-2">
              <Label className="flex items-center space-x-2">
                <Checkbox
                  checked={showGuides}
                  onCheckedChange={(checked: boolean) => setShowGuides(checked)}
                />
                <span>Show guides</span>
              </Label>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Zoom</Label>
                <span className="text-sm text-zinc-400">{zoom}%</span>
              </div>
              <Slider
                value={[zoom]}
                min={10}
                max={200}
                step={10}
                onValueChange={([value]: number[]) => setZoom(value)}
              />
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-800 space-y-4">
            <div className="text-xs text-zinc-500 text-center">
              {VERSION_HISTORY.current} • {VERSION_HISTORY.changes[0].date}
            </div>
            <TooltipRoot>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => window.open("mailto:ajayveyron9@gmail.com")}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Contact for features
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Request new features or report issues
              </TooltipContent>
            </TooltipRoot>
          </div>
        </div>

        {/* Update the drag overlay condition */}
        {isDraggingFile && (
          <div className="absolute inset-0 bg-zinc-950/80 flex items-center justify-center z-50 pointer-events-none">
            <div className="text-zinc-100 text-xl font-medium">
              Drop image to upload
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0">
          <div className="w-1/2 relative min-h-[50vh] md:min-h-0">
            <CheckerboardBackground />
            {!image ? (
              <div className="absolute inset-0 flex items-center justify-center text-zinc-400 p-4 text-center">
                Select or drag image to get started
              </div>
            ) : (
              <div className="w-full h-full overflow-auto">
                <div style={{ zoom: `${zoom}%` }}>
                  <canvas
                    ref={originalCanvasRef}
                    className="max-w-full h-auto"
                    onMouseDown={handleMouseDown}
                    onTouchStart={(e) => {
                      e.preventDefault();
                      const touch = e.touches[0];
                      handleMouseDown({
                        clientX: touch.clientX,
                        clientY: touch.clientY,
                        currentTarget: e.currentTarget,
                      } as any);
                    }}
                    onTouchMove={(e) => {
                      e.preventDefault();
                      const touch = e.touches[0];
                      handleMouseMove({
                        clientX: touch.clientX,
                        clientY: touch.clientY,
                        currentTarget: e.currentTarget,
                      } as any);
                    }}
                    onTouchEnd={handleMouseUp}
                    onMouseMove={(e) => {
                      const canvas = e.currentTarget;
                      const rect = canvas.getBoundingClientRect();
                      const x =
                        (e.clientX - rect.left) * (image!.width / rect.width);
                      const y =
                        (e.clientY - rect.top) * (image!.height / rect.height);
                      const threshold = 15;

                      const { top, right, bottom, left } = sliceSettings;

                      if (
                        Math.abs(x - left) < threshold ||
                        Math.abs(x - (image!.width - right)) < threshold
                      ) {
                        canvas.style.cursor = "ew-resize";
                      } else if (
                        Math.abs(y - top) < threshold ||
                        Math.abs(y - (image!.height - bottom)) < threshold
                      ) {
                        canvas.style.cursor = "ns-resize";
                      } else {
                        canvas.style.cursor = "default";
                      }

                      if (isDragging) {
                        handleMouseMove(e);
                      }
                    }}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Preview */}
          <div className="w-1/2 border-t md:border-t-0 md:border-l border-zinc-800 relative min-h-[50vh] md:min-h-0 flex items-center justify-center">
            <CheckerboardBackground />
            {image && (
              <div className="relative w-full h-full flex items-center justify-center">
                <canvas
                  ref={slicedCanvasRef}
                  className="max-w-full max-h-full object-contain"
                  style={{
                    width: previewDimensions.width * (zoom / 100),
                    height: previewDimensions.height * (zoom / 100),
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
