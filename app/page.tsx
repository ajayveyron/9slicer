"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { ImageIcon, Save } from "lucide-react";
import FileSaver from "file-saver";
import { CheckerboardBackground } from "@/components/checkerboard-background";

const DEFAULT_IMAGE_URL =
  "https://i.ibb.co/ZR1DPX4P/DALL-E-2025-02-02-20-30-15-A-gold-user-avatar-profile-frame-for-a-game-with-a-squarish-shape-and-a-b.webp";

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

    // Draw original image and guides
    originalCtx.drawImage(image, 0, 0);
    drawGuides(originalCtx, image.width, image.height);

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

    // Add guides to the processed image
    drawGuides(slicedCtx, slicedCanvas.width, slicedCanvas.height);
  };

  // Re-apply nine-slice when relevant properties change
  useEffect(() => {
    if (image) {
      applyNineSlice();
    }
  }, [image, sliceSettings, outputSize, showGuides]);

  // Handle image download
  const handleDownload = () => {
    if (slicedCanvasRef.current) {
      slicedCanvasRef.current.toBlob((blob) => {
        if (blob) {
          FileSaver.saveAs(blob, "9sliced-image.png");
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
      loadImageFromUrl(DEFAULT_IMAGE_URL);
    }
  }, []);

  return (
    <div className="flex flex-col md:flex-row h-screen bg-zinc-950 text-zinc-100">
      {/* Left Sidebar */}
      <div className="w-full md:w-72 border-b md:border-b-0 md:border-r border-zinc-800 p-4 flex flex-col">
        <div className="space-y-4 flex-1">
          <div>
            <Button
              className="w-full mb-2"
              onClick={() => document.getElementById("file-input")?.click()}
            >
              <ImageIcon className="mr-2 h-4 w-4" />
              Select image
            </Button>
            <input
              id="file-input"
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleImageUpload}
            />
            <Button className="w-full" onClick={handleDownload}>
              <Save className="mr-2 h-4 w-4" />
              Save image
            </Button>
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
              <div className="space-y-4">
                <Label>Output size:</Label>
                {Object.entries(outputSize).map(([key, value]) => (
                  <div key={key} className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor={`output-${key}`}>
                        {key.charAt(0).toUpperCase() + key.slice(1)}
                      </Label>
                      <span className="text-sm text-zinc-400">{value}px</span>
                    </div>
                    <Input
                      id={`output-${key}`}
                      type="number"
                      value={pendingOutputSize[key as keyof typeof outputSize]}
                      className="bg-zinc-900 border-zinc-800 text-zinc-100"
                      onChange={(e) =>
                        setPendingOutputSize((prev) => ({
                          ...prev,
                          [key]: Number.parseInt(e.target.value) || 0,
                        }))
                      }
                      onKeyDown={handleOutputSizeKeyDown}
                      onBlur={handleOutputSizeBlur}
                    />
                  </div>
                ))}
              </div>
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
      </div>

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
  );
}
