import React, { useEffect, useRef, useState } from 'react';
import * as fabric from 'fabric'; // v6 import
import { Type, Square, Download, Palette, Undo, RefreshCw, Check, MousePointer2, Type as TypeIcon, Circle, Triangle, LayoutTemplate, Image as ImageIcon, AlignCenter, AlignHorizontalJustifyCenter, AlignVerticalJustifyCenter, Bold, Italic, Underline, Plus, Minus, ChevronDown, Sparkles, Award } from 'lucide-react';
import CustomSelect from './CustomSelect';
import corporateTemplate from '../assets/corporate-template.png';
import creativeTemplate from '../assets/creative-template.png';
import academicTemplate from '../assets/academic-template.jpg';
import premiumTemplate from '../assets/premium-template.png';
import gradientTemplate from '../assets/gradient-modern.png';
import patternTemplate from '../assets/pattern-tech.png';

const FONTS = [
    { name: 'Inter', value: 'Inter, sans-serif' },
    { name: 'Serif', value: 'serif' },
    { name: 'Cursive', value: 'cursive' },
    { name: 'Monospace', value: 'monospace' },
    { name: 'Times New Roman', value: '"Times New Roman", serif' },
    { name: 'Pacifico', value: '"Pacifico", cursive' }, // Needs webfont loader if not system
];

const CertificateDesigner = ({ initialTemplate, onSave, onCancel }) => {
    const canvasRef = useRef(null);
    const fabricRef = useRef(null);
    const [fabricCanvas, setFabricCanvas] = useState(null);
    const [selectedObject, setSelectedObject] = useState(null);
    const [bgColor, setBgColor] = useState('#ffffff');
    const [showGrid, setShowGrid] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);
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

            // Load initial preset background if passed
            if (initialTemplate) {
                const imgObj = new Image();
                imgObj.src = initialTemplate;
                imgObj.onload = () => {
                    const imgInstance = new fabric.Image(imgObj);
                    const scaleX = 800 / imgInstance.width;
                    const scaleY = 600 / imgInstance.height;
                    const scale = Math.max(scaleX, scaleY);
                    imgInstance.scale(scale);
                    imgInstance.set({
                        originX: 'center',
                        originY: 'center',
                        left: 400,
                        top: 300,
                        selectable: false,
                        evented: false
                    });
                    canvas.backgroundImage = imgInstance;
                    canvas.renderAll();
                };
            }

            // Event listeners
            canvas.on('selection:created', (e) => setSelectedObject(e.selected[0]));
            canvas.on('selection:updated', (e) => setSelectedObject(e.selected[0]));
            canvas.on('selection:cleared', () => setSelectedObject(null));

            canvas.calcOffset();
            canvas.renderAll();
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

    const loadPresetImageTemplate = (imgSrc) => {
        if (!fabricCanvas) return;
        const imgObj = new Image();
        imgObj.src = imgSrc;
        imgObj.onload = () => {
            const imgInstance = new fabric.Image(imgObj);
            const scaleX = 800 / imgInstance.width;
            const scaleY = 600 / imgInstance.height;
            const scale = Math.max(scaleX, scaleY);
            imgInstance.scale(scale);
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

    const loadTemplate = (templateName) => {
        if (!fabricCanvas) return;

        // Clear existing canvas text objects except frame
        const objects = fabricCanvas.getObjects();
        objects.forEach(obj => {
            if (obj.id !== 'frame') fabricCanvas.remove(obj);
        });

        if (templateName === 'modern' || templateName === 'corporate') {
            const title = new fabric.IText('CERTIFICATE OF ACHIEVEMENT', {
                fontSize: 34,
                top: 85,
                fill: '#1e293b',
                fontFamily: 'serif',
                fontWeight: 'bold',
                charSpacing: 80
            });
            fabricCanvas.add(title);
            fabricCanvas.centerObjectH(title);

            const sub = new fabric.IText('THIS CREDENTIAL IS PROUDLY PRESENTED TO', {
                fontSize: 11,
                top: 155,
                fill: '#64748b',
                fontWeight: 'bold',
                charSpacing: 180
            });
            fabricCanvas.add(sub);
            fabricCanvas.centerObjectH(sub);

            const name = new fabric.IText('{{Recipient Name}}', {
                fontSize: 42,
                top: 220,
                fill: '#0f172a',
                fontFamily: 'serif',
                fontWeight: 'bold'
            });
            fabricCanvas.add(name);
            fabricCanvas.centerObjectH(name);

            const body = new fabric.IText('for successfully completing the accredited program of excellence', {
                fontSize: 14,
                top: 310,
                fill: '#475569',
                fontFamily: 'Inter, sans-serif'
            });
            fabricCanvas.add(body);
            fabricCanvas.centerObjectH(body);

            const date = new fabric.IText('Issue Date: {{Issue Date}}', { fontSize: 12, left: 160, top: 460, fill: '#64748b' });
            fabricCanvas.add(date);

            const sig = new fabric.IText('Authorized Signature', { fontSize: 12, left: 520, top: 460, fill: '#64748b' });
            fabricCanvas.add(sig);

        } else if (templateName === 'elegant' || templateName === 'academic') {
            const title = new fabric.IText('ACADEMIC DIPLOMA', {
                fontSize: 38,
                top: 90,
                fill: '#1e3a8a',
                fontFamily: 'serif',
                fontWeight: 'bold'
            });
            fabricCanvas.add(title);
            fabricCanvas.centerObjectH(title);

            const sub = new fabric.IText('BY THE AUTHORITY OF THE ACADEMIC BOARD', {
                fontSize: 10,
                top: 155,
                fill: '#475569',
                charSpacing: 160
            });
            fabricCanvas.add(sub);
            fabricCanvas.centerObjectH(sub);

            const name = new fabric.IText('{{Recipient Name}}', {
                fontSize: 44,
                top: 220,
                fill: '#0f172a',
                fontFamily: 'serif',
                fontWeight: 'bold'
            });
            fabricCanvas.add(name);
            fabricCanvas.centerObjectH(name);

            const body = new fabric.IText('has met all graduation criteria & academic requirements for', {
                fontSize: 13,
                top: 305,
                fill: '#334155'
            });
            fabricCanvas.add(body);
            fabricCanvas.centerObjectH(body);

            const course = new fabric.IText('{{Course Title}}', {
                fontSize: 22,
                top: 340,
                fill: '#1e40af',
                fontFamily: 'serif',
                fontWeight: 'bold'
            });
            fabricCanvas.add(course);
            fabricCanvas.centerObjectH(course);

        } else if (templateName === 'luxury' || templateName === 'premium') {
            const title = new fabric.IText('PRESIDENTIAL EXCELLENCE AWARD', {
                fontSize: 32,
                top: 80,
                fill: '#b45309',
                fontFamily: 'serif',
                fontWeight: 'bold',
                charSpacing: 100
            });
            fabricCanvas.add(title);
            fabricCanvas.centerObjectH(title);

            const name = new fabric.IText('{{Recipient Name}}', {
                fontSize: 46,
                top: 210,
                fill: '#78350f',
                fontFamily: 'serif',
                fontWeight: 'bold'
            });
            fabricCanvas.add(name);
            fabricCanvas.centerObjectH(name);

            const body = new fabric.IText('in recognition of distinguished leadership & exceptional service', {
                fontSize: 14,
                top: 300,
                fill: '#451a03'
            });
            fabricCanvas.add(body);
            fabricCanvas.centerObjectH(body);

        } else if (templateName === 'tech') {
            const title = new fabric.IText('CERTIFIED SYSTEM ARCHITECT', {
                fontSize: 32,
                top: 80,
                fill: '#0284c7',
                fontFamily: 'monospace',
                fontWeight: 'bold'
            });
            fabricCanvas.add(title);
            fabricCanvas.centerObjectH(title);

            const name = new fabric.IText('< {{Recipient Name}} />', {
                fontSize: 38,
                top: 210,
                fill: '#0f172a',
                fontFamily: 'monospace',
                fontWeight: 'bold'
            });
            fabricCanvas.add(name);
            fabricCanvas.centerObjectH(name);

            const sub = new fabric.IText('SHA-256 VERIFIED CREDENTIAL NODE', {
                fontSize: 11,
                top: 300,
                fill: '#0369a1',
                fontFamily: 'monospace',
                charSpacing: 140
            });
            fabricCanvas.add(sub);
            fabricCanvas.centerObjectH(sub);

        } else if (templateName === 'minimalist') {
            const title = new fabric.IText('CERTIFICATE OF RECOGNITION', {
                fontSize: 28,
                top: 110,
                fill: '#0f172a',
                fontFamily: 'serif',
                charSpacing: 250
            });
            fabricCanvas.add(title);
            fabricCanvas.centerObjectH(title);

            const name = new fabric.IText('{{Recipient Name}}', {
                fontSize: 42,
                top: 240,
                fill: '#1e293b',
                fontFamily: 'serif',
                fontWeight: 'bold'
            });
            fabricCanvas.add(name);
            fabricCanvas.centerObjectH(name);

            const body = new fabric.IText('for outstanding contributions & dedication', {
                fontSize: 14,
                top: 330,
                fill: '#64748b'
            });
            fabricCanvas.add(body);
            fabricCanvas.centerObjectH(body);

        } else if (templateName === 'modern2') {
            const title = new fabric.IText('GLOBAL INNOVATION AWARD', {
                fontSize: 36,
                top: 85,
                fill: '#0f172a',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 'bold'
            });
            fabricCanvas.add(title);
            fabricCanvas.centerObjectH(title);

            const name = new fabric.IText('{{Recipient Name}}', {
                fontSize: 46,
                top: 220,
                fill: '#2563eb',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 'bold'
            });
            fabricCanvas.add(name);
            fabricCanvas.centerObjectH(name);
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

    const analyzeDesign = () => {
        if (!fabricCanvas) return;
        setIsAnalyzing(true);

        // Simulate AI Analysis Delay
        setTimeout(() => {
            const objects = fabricCanvas.getObjects();
            const suggestions = [];
            let score = 90; // Start high

            // 1. Check for Content
            if (objects.length < 3) {
                suggestions.push("Design looks too empty. Try adding more elements or decorations.");
                score -= 20;
            }

            // 2. Check for Name Variable
            const hasNameVar = objects.some(o => o.type === 'i-text' && o.text.includes('{{'));
            if (!hasNameVar) {
                suggestions.push("Missing dynamic variable! Add '{{Name Here}}' to make it personal.");
                score -= 30; // Critical
            }

            // 3. Check for Contrast (Naive check)
            // If background is white and any text is light color
            if (bgColor === '#ffffff' || bgColor === '#f8fafc') {
                const lowContrastText = objects.some(o => o.type === 'i-text' && (o.fill === '#ffffff' || o.fill === '#f1f5f9'));
                if (lowContrastText) {
                    suggestions.push("Some text has low contrast against the background. Make it darker.");
                    score -= 15;
                }
            }

            // 4. Check for Visual Balance (Center of Mass)
            // Simple heuristic: if everything is on the left side
            const allLeft = objects.every(o => o.left < 300);
            if (objects.length > 0 && allLeft) {
                suggestions.push("Design feels unbalanced. Try centering your text or adding elements to the right.");
                score -= 10;
            }

            // 5. Positive Reinforcement
            if (suggestions.length === 0) {
                suggestions.push("Great use of negative space!");
                suggestions.push("Font choices look professional.");
                score = 100;
            }

            setAnalysisResult({ score: Math.max(0, score), suggestions });
            setIsAnalyzing(false);
        }, 1500); // 1.5s delay for "AI" effect
    };

    return (
        <div className="flex flex-col rounded-2xl overflow-hidden border border-[var(--border-muted)] bg-[var(--bg-card)] shadow-xl">
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

                    <button onClick={() => loadTemplate('corporate')} className="flex flex-col items-center gap-1 p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg w-20 transition-all group">
                        <LayoutTemplate size={20} className="group-hover:scale-110 transition-transform text-amber-500" />
                        <span className="text-[10px] font-medium">Modern</span>
                    </button>
                    <button onClick={() => loadTemplate('academic')} className="flex flex-col items-center gap-1 p-2 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg w-20 transition-all group">
                        <LayoutTemplate size={20} className="group-hover:scale-110 transition-transform text-violet-500" />
                        <span className="text-[10px] font-medium">Elegant</span>
                    </button>
                    <button onClick={() => loadTemplate('premium')} className="flex flex-col items-center gap-1 p-2 text-slate-500 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg w-20 transition-all group">
                        <LayoutTemplate size={20} className="group-hover:scale-110 transition-transform text-yellow-500" />
                        <span className="text-[10px] font-medium">Luxury</span>
                    </button>
                    <button onClick={() => loadTemplate('tech')} className="flex flex-col items-center gap-1 p-2 text-slate-500 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg w-20 transition-all group" title="Tech - Cyber Dark">
                        <LayoutTemplate size={20} className="group-hover:scale-110 transition-transform text-cyan-500" />
                        <span className="text-[10px] font-medium">Tech</span>
                    </button>
                    <button onClick={() => loadTemplate('minimalist')} className="flex flex-col items-center gap-1 p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg w-20 transition-all group" title="Minimalist - Clean & Elegant">
                        <LayoutTemplate size={20} className="group-hover:scale-110 transition-transform text-slate-600" />
                        <span className="text-[10px] font-medium">Minimal</span>
                    </button>
                    <button onClick={() => loadTemplate('modern2')} className="flex flex-col items-center gap-1 p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg w-20 transition-all group" title="Modern II - Geometric Bold">
                        <LayoutTemplate size={20} className="group-hover:scale-110 transition-transform text-rose-500" />
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
                <div className="flex-1 bg-slate-950/20 flex items-center justify-center relative overflow-auto p-3 sm:p-4">
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
                    <button
                        onClick={analyzeDesign}
                        disabled={isAnalyzing}
                        className={`flex items-center gap-2 px-5 py-2.5 font-bold rounded-lg border transition-all ${isAnalyzing ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white border-transparent hover:shadow-lg hover:shadow-purple-200'}`}
                    >
                        {isAnalyzing ? (
                            <>
                                <RefreshCw size={18} className="animate-spin" />
                                Analyzing...
                            </>
                        ) : (
                            <>
                                <Sparkles size={18} />
                                AI Analyze <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded uppercase tracking-wider">Beta</span>
                            </>
                        )}
                    </button>
                    <div className="w-px h-10 bg-slate-200 mx-2"></div>
                    <button onClick={onCancel} className="px-6 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors">
                        Cancel
                    </button>
                    <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-lg shadow-lg shadow-violet-200 transition-all hover:-translate-y-0.5">
                        <Check size={18} /> Finish Design
                    </button>
                </div>
            </div>

            {/* AI Analysis Result Modal */}
            {analysisResult && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden scale-100 animate-in zoom-in-95 duration-200">
                        <div className="bg-gradient-to-r from-fuchsia-600 to-purple-600 p-6 text-white">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-white/20 rounded-xl">
                                    <Sparkles size={24} className="text-white" />
                                </div>
                                <h3 className="text-xl font-bold">AI Design Critique</h3>
                            </div>
                            <p className="text-white/80 text-sm">Powered by Pramanit Intelligence</p>
                        </div>
                        <div className="p-6">
                            <div className="space-y-4">
                                {analysisResult.score >= 80 ? (
                                    <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex gap-3 text-emerald-800">
                                        <Check size={20} className="shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-bold">Excellent Design! ({analysisResult.score}/100)</p>
                                            <p className="text-sm opacity-80 mt-1">Ready for production. Good balance and contrast.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex gap-3 text-amber-800">
                                        <Triangle size={20} className="shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-bold">Good start, but needs polish ({analysisResult.score}/100)</p>
                                            <p className="text-sm opacity-80 mt-1">Review the suggestions below to improve impact.</p>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Suggestions</h4>
                                    {analysisResult.suggestions.map((s, i) => (
                                        <div key={i} className="flex gap-2 text-sm text-slate-600 items-start">
                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 shrink-0" />
                                            {s}
                                        </div>
                                    ))}
                                    {analysisResult.suggestions.length === 0 && (
                                        <p className="text-sm text-slate-500 italic">No critical issues found.</p>
                                    )}
                                </div>
                            </div>
                            <div className="mt-8">
                                <button
                                    onClick={() => setAnalysisResult(null)}
                                    className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
                                >
                                    Close & Continue Editing
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CertificateDesigner;
