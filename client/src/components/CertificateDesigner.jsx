import React, { useEffect, useRef, useState } from 'react';
import * as fabric from 'fabric'; // v6 import
import { Type, Square, Download, Palette, Undo, RefreshCw, Check, MousePointer2, Type as TypeIcon, Circle, Triangle, LayoutTemplate, Image as ImageIcon, AlignCenter, AlignHorizontalJustifyCenter, AlignVerticalJustifyCenter, Bold, Italic, Underline, Plus, Minus, ChevronDown } from 'lucide-react';
import CustomSelect from './CustomSelect';

const FONTS = [
    { name: 'Inter', value: 'Inter, sans-serif' },
    { name: 'Serif', value: 'serif' },
    { name: 'Cursive', value: 'cursive' },
    { name: 'Monospace', value: 'monospace' },
    { name: 'Times New Roman', value: '"Times New Roman", serif' },
    { name: 'Pacifico', value: '"Pacifico", cursive' }, // Needs webfont loader if not system
];

const CertificateDesigner = ({ onSave, onCancel }) => {
    const canvasRef = useRef(null);
    const fabricRef = useRef(null);
    const [fabricCanvas, setFabricCanvas] = useState(null);
    const [selectedObject, setSelectedObject] = useState(null);
    const [bgColor, setBgColor] = useState('#ffffff');
    const [showGrid, setShowGrid] = useState(false);
    const fileInputRef = useRef(null);
    const bgInputRef = useRef(null);
    const sigInputRef = useRef(null);

    useEffect(() => {
        if (canvasRef.current && !fabricRef.current) {
            // Initialize canvas with explicit dimensions
            const canvas = new fabric.Canvas(canvasRef.current, {
                height: 600,
                width: 800,
                backgroundColor: '#ffffff',
                selection: true,
                preserveObjectStacking: true, // Better for editing
            });

            fabricRef.current = canvas;
            setFabricCanvas(canvas);

            // Add a default border frame
            const rect = new fabric.Rect({
                left: 400, // Center X
                top: 300, // Center Y
                fill: 'transparent',
                width: 640, // 800 - 160 (80px margins)
                height: 440, // 600 - 160 (80px margins)
                stroke: '#7c3aed', // violet-600
                strokeWidth: 5,
                selectable: false,
                evented: false,
                rx: 10,
                ry: 10,
                id: 'frame',
                originX: 'center', // Center origin
                originY: 'center' // Center origin
            });
            canvas.add(rect);

            // Event listeners
            canvas.on('selection:created', (e) => setSelectedObject(e.selected[0]));
            canvas.on('selection:updated', (e) => setSelectedObject(e.selected[0]));
            canvas.on('selection:cleared', () => setSelectedObject(null));

            // Fix for visual scaling/offset issues
            // We set the dimensions on the wrapper element if needed, but here we strictly control the canvas
            // requestAnimationFrame ensures we run after React's paint
            requestAnimationFrame(() => {
                canvas.setDimensions({ width: 800, height: 600 });
                canvas.calcOffset();
                canvas.renderAll();
            });
        }

        return () => {
            if (fabricRef.current) {
                fabricRef.current.dispose();
                fabricRef.current = null;
                setFabricCanvas(null);
            }
        };
    }, []);

    const addText = (textStr = 'Your Title Here', options = {}) => {
        if (!fabricCanvas) return;
        const text = new fabric.IText(textStr, {
            left: 200,
            top: 200,
            fontFamily: 'Inter, sans-serif',
            fill: '#1e293b', // slate-800
            fontSize: 32,
            fontWeight: 'bold',
            ...options
        });
        fabricCanvas.add(text);
        fabricCanvas.setActiveObject(text);
    };

    const addShape = (type) => {
        if (!fabricCanvas) return;
        let shape;
        if (type === 'rect') {
            shape = new fabric.Rect({
                left: 300,
                top: 300,
                fill: '#f472b6', // pink-400
                width: 100,
                height: 100,
                rx: 5,
                ry: 5
            });
        } else if (type === 'circle') {
            shape = new fabric.Circle({
                left: 300,
                top: 300,
                fill: '#a78bfa', // violet-400
                radius: 50,
            });
        }

        fabricCanvas.add(shape);
        fabricCanvas.setActiveObject(shape);
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file || !fabricCanvas) return;

        const reader = new FileReader();
        reader.onload = (f) => {
            const imgObj = new Image();
            imgObj.src = f.target.result;
            imgObj.onload = () => {
                const imgInstance = new fabric.Image(imgObj);
                // Scale down if too big
                const scale = Math.min(200 / imgInstance.width, 200 / imgInstance.height);
                imgInstance.scale(scale);
                imgInstance.set({
                    left: 400 - (imgInstance.getScaledWidth() / 2),
                    top: 300 - (imgInstance.getScaledHeight() / 2)
                });
                fabricCanvas.add(imgInstance);
                fabricCanvas.setActiveObject(imgInstance);
            };
        };
        reader.readAsDataURL(file);
        reader.readAsDataURL(file);
        // Reset input
        e.target.value = '';
    };

    const handleBgUpload = (e) => {
        const file = e.target.files[0];
        if (!file || !fabricCanvas) return;

        const reader = new FileReader();
        reader.onload = (f) => {
            const imgObj = new Image();
            imgObj.src = f.target.result;
            imgObj.onload = () => {
                const imgInstance = new fabric.Image(imgObj);
                // Scale to cover 800x600
                const scaleX = 800 / imgInstance.width;
                const scaleY = 600 / imgInstance.height;
                const scale = Math.max(scaleX, scaleY);

                imgInstance.scale(scale);
                // Center crop roughly
                imgInstance.set({
                    originX: 'center',
                    originY: 'center',
                    left: 400,
                    top: 300,
                    selectable: false,
                    evented: false
                });

                fabricCanvas.backgroundImage = imgInstance;
                fabricCanvas.renderAll();
            };
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const handleSignatureUpload = (e) => {
        const file = e.target.files[0];
        if (!file || !fabricCanvas) return;

        const reader = new FileReader();
        reader.onload = (f) => {
            const imgObj = new Image();
            imgObj.src = f.target.result;
            imgObj.onload = () => {
                const imgInstance = new fabric.Image(imgObj);
                // Scale signature reasonably
                const scale = Math.min(150 / imgInstance.width, 100 / imgInstance.height);
                imgInstance.scale(scale);

                // Auto-place in bottom right signature area
                imgInstance.set({
                    left: 550,
                    top: 400
                });

                fabricCanvas.add(imgInstance);
                fabricCanvas.setActiveObject(imgInstance);
            };
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const toggleFrame = () => {
        if (!fabricCanvas) return;
        const frame = fabricCanvas.getObjects().find(o => o.id === 'frame');
        if (frame) {
            frame.set('visible', !frame.visible);
            fabricCanvas.requestRenderAll();
        }
    };

    const toggleGrid = () => {
        if (!fabricCanvas) return;

        if (showGrid) {
            // Remove grid
            const gridLines = fabricCanvas.getObjects().filter(o => o.id === 'grid-line');
            gridLines.forEach(line => fabricCanvas.remove(line));
            setShowGrid(false);
        } else {
            // Add grid
            const gridSize = 50;
            const width = 800;
            const height = 600;

            for (let i = 0; i < (width / gridSize); i++) {
                fabricCanvas.add(new fabric.Line([i * gridSize, 0, i * gridSize, height], {
                    stroke: '#ccc', selectable: false, evented: false, id: 'grid-line', opacity: 0.5
                }));
            }
            for (let i = 0; i < (height / gridSize); i++) {
                fabricCanvas.add(new fabric.Line([0, i * gridSize, width, i * gridSize], {
                    stroke: '#ccc', selectable: false, evented: false, id: 'grid-line', opacity: 0.5
                }));
            }
            setShowGrid(true);

            // Bring frame and selection to top
            const frame = fabricCanvas.getObjects().find(o => o.id === 'frame');
            if (frame) fabricCanvas.bringObjectToFront(frame);
        }
    };

    const duplicateSelected = () => {
        if (!fabricCanvas || !selectedObject) return;

        selectedObject.clone().then((cloned) => {
            cloned.set({
                left: selectedObject.left + 20,
                top: selectedObject.top + 20,
                evented: true,
            });

            if (cloned.type === 'activeSelection') {
                cloned.canvas = fabricCanvas;
                cloned.forEachObject((obj) => {
                    fabricCanvas.add(obj);
                });
                cloned.setCoords();
            } else {
                fabricCanvas.add(cloned);
            }

            fabricCanvas.setActiveObject(cloned);
            fabricCanvas.requestRenderAll();
        });
    };

    const loadTemplate = (templateName) => {
        if (!fabricCanvas) return;
        resetCanvas();

        if (templateName === 'modern') {
            changeBgColor('#f8fafc');
            const title = new fabric.IText('CERTIFICATE', { fontSize: 50, top: 80, fill: '#334155', fontFamily: 'serif' });
            fabricCanvas.add(title);
            fabricCanvas.centerObjectH(title); // Auto center horizontally

            const sub = new fabric.IText('OF APPRECIATION', { fontSize: 20, top: 140, fill: '#64748b' });
            // Manually setting 'charSpacing' is v6 property? fabric usually uses charSpacing
            sub.set({ charSpacing: 200 });
            fabricCanvas.add(sub);
            fabricCanvas.centerObjectH(sub);

            const body1 = new fabric.IText('This certificate is proudly presented to', { fontSize: 16, top: 220, fill: '#94a3b8' });
            fabricCanvas.add(body1);
            fabricCanvas.centerObjectH(body1);

            const name = new fabric.IText('{{Name Here}}', { fontSize: 40, top: 260, fill: '#0f172a' });
            fabricCanvas.add(name);
            fabricCanvas.centerObjectH(name);

            const line = new fabric.Rect({ top: 320, width: 400, height: 2, fill: '#e2e8f0' });
            fabricCanvas.add(line);
            fabricCanvas.centerObjectH(line);

            // Signature area
            const sigText = new fabric.IText('Authorized Signature', { fontSize: 14, left: 550, top: 450, fill: '#64748b' });
            fabricCanvas.add(sigText);
            const sigLine = new fabric.Rect({ left: 530, top: 440, width: 200, height: 1, fill: '#cbd5e1' });
            fabricCanvas.add(sigLine);

        } else if (templateName === 'elegant') {
            changeBgColor('#fffbeb');
            const frame = fabricCanvas.getObjects().find(o => o.id === 'frame');
            if (frame) frame.set({ stroke: '#b45309' });

            const title = new fabric.IText('Certificate of Achievement', { fontSize: 45, top: 80, fill: '#78350f', fontFamily: 'cursive' });
            fabricCanvas.add(title);
            fabricCanvas.centerObjectH(title);

            const body = new fabric.IText('Awarded to', { fontSize: 18, top: 180, fill: '#92400e' });
            fabricCanvas.add(body);
            fabricCanvas.centerObjectH(body);

            const name = new fabric.IText('{{Name Here}}', { fontSize: 42, top: 230, fill: '#451a03', fontFamily: 'serif' });
            fabricCanvas.add(name);
            fabricCanvas.centerObjectH(name);

            // Decoration
            const circle = new fabric.Circle({ left: 350, top: 350, radius: 40, fill: 'transparent', stroke: '#b45309', strokeWidth: 2 });
            fabricCanvas.add(circle);
            const logoText = new fabric.IText('Logo', { fontSize: 12, left: 375, top: 385, fill: '#b45309' });
            fabricCanvas.add(logoText);
        } else if (templateName === 'luxury') {
            // Luxury: Black & Gold
            changeBgColor('#0f172a'); // Slate 900
            const frame = fabricCanvas.getObjects().find(o => o.id === 'frame');
            if (frame) frame.set({ stroke: '#fbbf24', strokeWidth: 8 }); // Amber 400

            const title = new fabric.IText('Excellence Award', { fontSize: 50, top: 80, fill: '#fbbf24', fontFamily: 'serif', fontWeight: 'bold' });
            fabricCanvas.add(title);
            fabricCanvas.centerObjectH(title);

            const sub = new fabric.IText('Presented to', { fontSize: 20, top: 160, fill: '#94a3b8' });
            fabricCanvas.add(sub);
            fabricCanvas.centerObjectH(sub);

            const name = new fabric.IText('{{Name Here}}', { fontSize: 48, top: 220, fill: '#fcd34d', fontFamily: 'serif' });
            fabricCanvas.add(name);
            fabricCanvas.centerObjectH(name);

            const line = new fabric.Rect({ top: 300, width: 300, height: 3, fill: '#fbbf24' });
            fabricCanvas.add(line);
            fabricCanvas.centerObjectH(line);

            const sigText = new fabric.IText('Signature', { fontSize: 16, left: 500, top: 380, fill: '#fbbf24' });
            fabricCanvas.add(sigText);

        } else if (templateName === 'tech') {
            // Tech: Matrix style or Dark Cyber
            changeBgColor('#111827');
            const frame = fabricCanvas.getObjects().find(o => o.id === 'frame');
            if (frame) frame.set({ stroke: '#06b6d4' }); // Cyan 500

            const title = new fabric.IText('CERTIFIED DEVELOPER', { fontSize: 40, top: 70, fill: '#22d3ee', fontFamily: 'monospace', fontWeight: 'bold' });
            fabricCanvas.add(title);
            fabricCanvas.centerObjectH(title);

            const name = new fabric.IText('< {{Name Here}} />', { fontSize: 36, top: 200, fill: '#e879f9', fontFamily: 'monospace' });
            fabricCanvas.add(name);
            fabricCanvas.centerObjectH(name);

            const codeDeco = new fabric.IText('isValid = true;', { fontSize: 14, left: 50, top: 50, fill: '#164e63' });
            fabricCanvas.add(codeDeco);

            const box = new fabric.Rect({ left: 300, top: 320, width: 200, height: 60, fill: 'transparent', stroke: '#06b6d4', strokeWidth: 2 });
            fabricCanvas.add(box);
            const badge = new fabric.IText('SKILL VERIFIED', { fontSize: 18, left: 335, top: 340, fill: '#22d3ee', fontFamily: 'monospace' });
            fabricCanvas.add(badge);
        } else if (templateName === 'minimalist') {
            // Minimalist: Clean, Lots of white space, Thin lines
            changeBgColor('#ffffff');
            const frame = fabricCanvas.getObjects().find(o => o.id === 'frame');
            if (frame) frame.set({ stroke: '#e2e8f0', strokeWidth: 1 });

            const title = new fabric.IText('CERTIFICATE', { fontSize: 32, top: 100, fill: '#0f172a', fontWeight: 'light', charSpacing: 400 });
            fabricCanvas.add(title);
            fabricCanvas.centerObjectH(title);

            const name = new fabric.IText('{{Name Here}}', { fontSize: 44, top: 240, fill: '#1e293b', fontFamily: 'serif' });
            fabricCanvas.add(name);
            fabricCanvas.centerObjectH(name);

            const line = new fabric.Rect({ top: 310, width: 200, height: 1, fill: '#334155' });
            fabricCanvas.add(line);
            fabricCanvas.centerObjectH(line);

            const sub = new fabric.IText('For outstanding participation and achievement', { fontSize: 14, top: 330, fill: '#64748b' });
            fabricCanvas.add(sub);
            fabricCanvas.centerObjectH(sub);

        } else if (templateName === 'modern2') {
            // Modern II: Geometric accents, bold colors
            changeBgColor('#f1f5f9');
            const frame = fabricCanvas.getObjects().find(o => o.id === 'frame');
            if (frame) frame.set({ stroke: '#3b82f6', strokeWidth: 10 });

            // Geometric accents
            const rectLeft = new fabric.Rect({ left: 0, top: 0, width: 100, height: 600, fill: '#3b82f6', opacity: 0.1, selectable: false });
            fabricCanvas.add(rectLeft);

            const title = new fabric.IText('AWARD OF COMPLETION', { fontSize: 38, top: 80, fill: '#1e3a8a', fontWeight: '900' });
            fabricCanvas.add(title);
            fabricCanvas.centerObjectH(title);

            const sub = new fabric.IText('THIS IS TO CERTIFY THAT', { fontSize: 12, top: 150, fill: '#64748b', charSpacing: 200 });
            fabricCanvas.add(sub);
            fabricCanvas.centerObjectH(sub);

            const name = new fabric.IText('{{Name Here}}', { fontSize: 52, top: 220, fill: '#2563eb', fontWeight: 'bold' });
            fabricCanvas.add(name);
            fabricCanvas.centerObjectH(name);

            const body = new fabric.IText('has successfully completed the required course of study.', { fontSize: 16, top: 320, fill: '#475569', width: 400, textAlign: 'center' });
            fabricCanvas.add(body);
            fabricCanvas.centerObjectH(body);

            const date = new fabric.IText('Date: ' + new Date().toLocaleDateString(), { fontSize: 14, left: 150, top: 450, fill: '#64748b' });
            fabricCanvas.add(date);
        }
        fabricCanvas.requestRenderAll();
    };

    const alignObject = (alignment) => {
        if (!fabricCanvas || !selectedObject) return;

        if (alignment === 'centerH') {
            selectedObject.centerH();
        } else if (alignment === 'centerV') {
            selectedObject.centerV();
        } else if (alignment === 'center') {
            selectedObject.center();
        }
        selectedObject.setCoords();
        fabricCanvas.requestRenderAll();
    };

    const changeBgColor = (color) => {
        if (!fabricCanvas) return;

        if (color.startsWith('gradient')) {
            let gradient;
            if (color === 'gradient-sunset') {
                gradient = new fabric.Gradient({
                    type: 'linear',
                    coords: { x1: 0, y1: 0, x2: 800, y2: 600 },
                    colorStops: [
                        { offset: 0, color: '#f9a8d4' }, // pink-300
                        { offset: 1, color: '#fcd34d' }  // amber-300
                    ]
                });
            } else if (color === 'gradient-ocean') {
                gradient = new fabric.Gradient({
                    type: 'linear',
                    coords: { x1: 0, y1: 0, x2: 800, y2: 600 },
                    colorStops: [
                        { offset: 0, color: '#67e8f9' }, // cyan-300
                        { offset: 1, color: '#3b82f6' }  // blue-500
                    ]
                });
            }

            if (gradient) {
                setBgColor(typeof color === 'string' ? color : '#ffffff');
                fabricCanvas.backgroundColor = gradient;
                fabricCanvas.renderAll();
                return;
            }
        }

        setBgColor(color);
        fabricCanvas.backgroundColor = color;
        fabricCanvas.renderAll();
    };

    const updateSelectedObject = (prop, value) => {
        if (!fabricCanvas || !selectedObject) return;

        if (prop === 'fill') selectedObject.set('fill', value);
        if (prop === 'fontSize') selectedObject.set('fontSize', parseInt(value));
        if (prop === 'fontFamily') selectedObject.set('fontFamily', value);
        if (prop === 'fontWeight') selectedObject.set('fontWeight', value === 'bold' ? (selectedObject.fontWeight === 'bold' ? 'normal' : 'bold') : value);
        if (prop === 'fontStyle') selectedObject.set('fontStyle', value === 'italic' ? (selectedObject.fontStyle === 'italic' ? 'normal' : 'italic') : value);
        if (prop === 'underline') selectedObject.set('underline', !selectedObject.underline);

        selectedObject.setCoords();
        fabricCanvas.requestRenderAll();
        // Force refresh state to update UI if needed
        setSelectedObject({ ...selectedObject });
    };

    const deleteSelected = () => {
        if (!fabricCanvas || !selectedObject) return;
        fabricCanvas.remove(selectedObject);
        fabricCanvas.discardActiveObject();
        fabricCanvas.requestRenderAll();
        setSelectedObject(null);
    };

    const resetCanvas = () => {
        if (!fabricCanvas) return;
        fabricCanvas.clear();
        fabricCanvas.backgroundColor = bgColor;
        const rect = new fabric.Rect({
            left: 400,
            top: 300,
            fill: 'transparent',
            width: 640, // 80px margins
            height: 440, // 80px margins
            stroke: '#7c3aed',
            strokeWidth: 5,
            selectable: false,
            evented: false,
            rx: 10,
            ry: 10,
            id: 'frame',
            originX: 'center',
            originY: 'center'
        });
        fabricCanvas.add(rect);
    };

    const handleSave = () => {
        if (!fabricCanvas) return;
        const dataURL = fabricCanvas.toDataURL({
            format: 'png',
            quality: 1,
            multiplier: 2
        });

        fetch(dataURL)
            .then(res => res.blob())
            .then(blob => {
                const file = new File([blob], "designed_certificate.png", { type: "image/png" });
                onSave(file);
            });
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 rounded-xl overflow-hidden border border-slate-200 shadow-xl">
            {/* Top Toolbar - Properties */}
            <div className="bg-white border-b border-slate-200 p-2 flex items-center gap-4 h-14 px-6 z-10 overflow-x-auto whitespace-nowrap custom-scrollbar">
                <div className="font-bold text-slate-700 mr-4 flex items-center gap-2 flex-shrink-0">
                    <Palette className="text-violet-600" size={20} /> Designer
                </div>

                <div className="flex gap-2 mr-4 flex-shrink-0">
                    <button onClick={toggleFrame} className="p-1.5 hover:bg-slate-100 rounded text-slate-600 border border-slate-200" title="Toggle Frame/Border">
                        <Square size={18} className="text-violet-500" />
                    </button>
                    <button onClick={toggleGrid} className={`p-1.5 hover:bg-slate-100 rounded border border-slate-200  ${showGrid ? 'bg-violet-50 text-violet-600' : 'text-slate-600'}`} title="Toggle Grid">
                        <LayoutTemplate size={18} />
                    </button>
                </div>

                <div className="h-6 w-px bg-slate-200 mx-2 flex-shrink-0"></div>

                {selectedObject ? (
                    <>
                        <div className="flex gap-1 mr-4 flex-shrink-0">
                            <button onClick={() => alignObject('centerH')} title="Center Horizontally" className="p-1.5 hover:bg-slate-100 rounded text-slate-600">
                                <AlignHorizontalJustifyCenter size={18} />
                            </button>
                            <button onClick={() => alignObject('centerV')} title="Center Vertically" className="p-1.5 hover:bg-slate-100 rounded text-slate-600">
                                <AlignVerticalJustifyCenter size={18} />
                            </button>
                            <button onClick={() => alignObject('center')} title="Center Both" className="p-1.5 hover:bg-slate-100 rounded text-slate-600">
                                <AlignCenter size={18} />
                            </button>
                        </div>

                        <div className="flex items-center gap-2 border-l border-slate-200 pl-4 mr-4">
                            <button onClick={duplicateSelected} title="Duplicate Selected" className="flex items-center gap-1 px-3 py-1.5 bg-violet-50 text-violet-600 rounded-md hover:bg-violet-100 transition-colors font-medium text-xs border border-violet-100">
                                <RefreshCw size={14} className="rotate-0" /> Duplicate
                            </button>
                        </div>

                        <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
                            <label className="text-xs font-semibold text-slate-500 uppercase">Color</label>
                            <input
                                type="color"
                                value={selectedObject.fill}
                                onChange={(e) => updateSelectedObject('fill', e.target.value)}
                                className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                            />
                        </div>

                        {selectedObject.type === 'i-text' && (
                            <>
                                <div className="flex items-center gap-2 ml-4 border-l border-slate-200 pl-4">
                                    <CustomSelect
                                        value={selectedObject.fontFamily}
                                        onChange={(val) => updateSelectedObject('fontFamily', val)}
                                        options={FONTS}
                                        className="w-32"
                                    />
                                </div>

                                <div className="flex gap-1 ml-2">
                                    <button
                                        onClick={() => updateSelectedObject('fontWeight', 'bold')}
                                        className={`p-1.5 rounded ${selectedObject.fontWeight === 'bold' ? 'bg-violet-100 text-violet-600' : 'hover:bg-slate-100 text-slate-500'}`}
                                        title="Bold"
                                    >
                                        <Bold size={16} />
                                    </button>
                                    <button
                                        onClick={() => updateSelectedObject('fontStyle', 'italic')}
                                        className={`p-1.5 rounded ${selectedObject.fontStyle === 'italic' ? 'bg-violet-100 text-violet-600' : 'hover:bg-slate-100 text-slate-500'}`}
                                        title="Italic"
                                    >
                                        <Italic size={16} />
                                    </button>
                                    <button
                                        onClick={() => updateSelectedObject('underline', true)}
                                        className={`p-1.5 rounded ${selectedObject.underline ? 'bg-violet-100 text-violet-600' : 'hover:bg-slate-100 text-slate-500'}`}
                                        title="Underline"
                                    >
                                        <Underline size={16} />
                                    </button>
                                </div>

                                <div className="flex items-center gap-2 ml-4 border-l border-slate-200 pl-4">
                                    <label className="text-xs font-semibold text-slate-500 uppercase">Size</label>
                                    <div className="flex items-center border border-slate-200 rounded-md">
                                        <button
                                            onClick={() => updateSelectedObject('fontSize', selectedObject.fontSize - 2)}
                                            className="p-1 hover:bg-slate-100 text-slate-500 border-r border-slate-200"
                                        >
                                            <Minus size={14} />
                                        </button>
                                        <input
                                            type="number"
                                            value={selectedObject.fontSize}
                                            onChange={(e) => updateSelectedObject('fontSize', e.target.value)}
                                            className="w-12 py-1 text-center text-sm focus:outline-none"
                                        />
                                        <button
                                            onClick={() => updateSelectedObject('fontSize', selectedObject.fontSize + 2)}
                                            className="p-1 hover:bg-slate-100 text-slate-500 border-l border-slate-200"
                                        >
                                            <Plus size={14} />
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}

                        <div className="ml-auto">
                            <button onClick={deleteSelected} className="text-red-500 hover:text-red-700 text-sm font-medium px-3 py-1 bg-red-50 hover:bg-red-100 rounded-md transition-colors">
                                Delete Selected
                            </button>
                        </div>
                    </>
                ) : (
                    <span className="text-slate-400 text-sm">Select an element to edit properties</span>
                )}
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Left Sidebar - Tools */}
                <div className="w-24 bg-white border-r border-slate-200 flex flex-col items-center py-4 gap-2 z-10 shadow-[4px_0_24px_rgba(0,0,0,0.02)] overflow-y-auto">
                    <div className="w-full px-2 mb-2"><span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-2">Insert</span></div>

                    <button onClick={() => addText('Text')} className="flex flex-col items-center gap-1 p-2 text-slate-500 hover:text-violet-600 hover:bg-violet-50 rounded-lg w-20 transition-all group">
                        <Type size={20} className="group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-medium">Text</span>
                    </button>

                    <button onClick={() => addShape('rect')} className="flex flex-col items-center gap-1 p-2 text-slate-500 hover:text-pink-600 hover:bg-pink-50 rounded-lg w-20 transition-all group">
                        <Square size={20} className="group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-medium">Box</span>
                    </button>

                    <button onClick={() => addShape('circle')} className="flex flex-col items-center gap-1 p-2 text-slate-500 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg w-20 transition-all group">
                        <Circle size={20} className="group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-medium">Circle</span>
                    </button>

                    <button onClick={() => fileInputRef.current.click()} className="flex flex-col items-center gap-1 p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg w-20 transition-all group">
                        <ImageIcon size={20} className="group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-medium">Image</span>
                        <input
                            type="file"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            accept="image/*"
                            onChange={handleImageUpload}
                        />
                    </button>

                    <button onClick={() => sigInputRef.current.click()} className="flex flex-col items-center gap-1 p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg w-20 transition-all group">
                        <MousePointer2 size={20} className="group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-medium">Signature</span>
                        <input
                            type="file"
                            ref={sigInputRef}
                            style={{ display: 'none' }}
                            accept="image/png"
                            onChange={handleSignatureUpload}
                        />
                    </button>

                    <div className="w-16 h-px bg-slate-200 my-2"></div>
                    <div className="w-full px-2 mb-2"><span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-2">Templates</span></div>

                    <button onClick={() => loadTemplate('modern')} className="flex flex-col items-center gap-1 p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg w-20 transition-all group">
                        <LayoutTemplate size={20} className="group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-medium">Modern</span>
                    </button>
                    <button onClick={() => loadTemplate('elegant')} className="flex flex-col items-center gap-1 p-2 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg w-20 transition-all group">
                        <LayoutTemplate size={20} className="group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-medium">Elegant</span>
                    </button>
                    <button onClick={() => loadTemplate('luxury')} className="flex flex-col items-center gap-1 p-2 text-slate-500 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg w-20 transition-all group">
                        <LayoutTemplate size={20} className="group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-medium">Luxury</span>
                    </button>
                    <button onClick={() => loadTemplate('tech')} className="flex flex-col items-center gap-1 p-2 text-slate-500 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg w-20 transition-all group" title="Tech - Cyber Dark">
                        <LayoutTemplate size={20} className="group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-medium">Tech</span>
                    </button>
                    <button onClick={() => loadTemplate('minimalist')} className="flex flex-col items-center gap-1 p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg w-20 transition-all group" title="Minimalist - Clean & Elegant">
                        <LayoutTemplate size={20} className="group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-medium">Minimal</span>
                    </button>
                    <button onClick={() => loadTemplate('modern2')} className="flex flex-col items-center gap-1 p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg w-20 transition-all group" title="Modern II - Geometric Bold">
                        <LayoutTemplate size={20} className="group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-medium">Modern II</span>
                    </button>

                    <div className="w-16 h-px bg-slate-200 my-2"></div>

                    <div className="flex flex-col gap-2 items-center">
                        <span className="text-[10px] font-medium text-slate-400 mb-1">Canvas RGB</span>
                        <div className="grid grid-cols-2 gap-2">
                            {['#ffffff', '#fdf2f8', '#eff6ff', '#f0fdf4', '#fffbeb', '#1e293b'].map(c => (
                                <button
                                    key={c}
                                    onClick={() => changeBgColor(c)}
                                    className={`w-6 h-6 rounded-full border border-slate-200 shadow-sm hover:scale-110 transition-transform ${bgColor === c ? 'ring-2 ring-violet-500 ring-offset-2' : ''}`}
                                    style={{ backgroundColor: c }}
                                    title={c}
                                />
                            ))}
                            <button onClick={() => changeBgColor('gradient-sunset')} className="w-6 h-6 rounded-full border border-slate-200 shadow-sm bg-gradient-to-br from-pink-300 to-amber-300 hover:scale-110 transition-transform" title="Sunset"></button>
                            <button onClick={() => changeBgColor('gradient-ocean')} className="w-6 h-6 rounded-full border border-slate-200 shadow-sm bg-gradient-to-br from-cyan-300 to-blue-500 hover:scale-110 transition-transform" title="Ocean"></button>

                            <button onClick={() => bgInputRef.current.click()} className="w-6 h-6 rounded-full border border-slate-200 shadow-sm bg-slate-100 flex items-center justify-center hover:scale-110 transition-transform group" title="Upload Background Image">
                                <ImageIcon size={12} className="text-slate-500 group-hover:text-violet-600" />
                            </button>
                            <input
                                type="file"
                                ref={bgInputRef}
                                style={{ display: 'none' }}
                                accept="image/*"
                                onChange={handleBgUpload}
                            />
                        </div>
                    </div>
                </div>

                {/* Main Canvas Workspace */}
                <div className="flex-1 bg-slate-100 flex items-center justify-center relative overflow-auto p-8">
                    {/* Checkered pattern background for canvas area */}
                    <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(#64748b 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

                    <div className="relative shadow-2xl rounded-sm overflow-hidden" style={{ width: 800, height: 600 }}>
                        <canvas ref={canvasRef} />
                    </div>
                </div>
            </div>

            {/* Bottom Bar - Actions */}
            <div className="h-16 bg-white border-t border-slate-200 px-6 flex items-center justify-between z-10">
                <button onClick={resetCanvas} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-medium px-4 py-2 rounded-lg hover:bg-slate-100 transition-colors">
                    <Undo size={18} /> Reset
                </button>
                <div className="flex gap-3">
                    <button onClick={onCancel} className="px-6 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors">
                        Cancel
                    </button>
                    <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-lg shadow-lg shadow-violet-200 transition-all hover:-translate-y-0.5">
                        <Check size={18} /> Finish Design
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CertificateDesigner;
