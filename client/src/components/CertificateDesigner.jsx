import React, { useEffect, useRef, useState } from 'react';
import * as fabric from 'fabric'; // v6 import
import { Type, Square, Download, Palette, Undo, RefreshCw, Check, MousePointer2, Type as TypeIcon, Circle, Triangle, LayoutTemplate, Image as ImageIcon, AlignCenter, AlignHorizontalJustifyCenter, AlignVerticalJustifyCenter, Bold, Italic, Underline, Plus, Minus, ChevronDown, Sparkles, Award, ZoomIn, ZoomOut, Maximize2, Hand, Move, RotateCcw, RotateCw, FileText, Maximize } from 'lucide-react';
import CustomSelect from './CustomSelect';

const FONTS = [
    { name: 'Inter', value: 'Inter, sans-serif' },
    { name: 'Serif', value: 'serif' },
    { name: 'Cursive', value: 'cursive' },
    { name: 'Monospace', value: 'monospace' },
    { name: 'Times New Roman', value: '"Times New Roman", serif' },
    { name: 'Pacifico', value: '"Pacifico", cursive' },
];

const CertificateDesigner = ({ initialTemplate, onSave, onCancel }) => {
    const canvasRef = useRef(null);
    const fabricRef = useRef(null);
    const workspaceRef = useRef(null);

    const [fabricCanvas, setFabricCanvas] = useState(null);
    const [selectedObject, setSelectedObject] = useState(null);
    const [bgColor, setBgColor] = useState('#ffffff');
    const [showGrid, setShowGrid] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [zoomLevel, setZoomLevel] = useState(1);
    const [isPanMode, setIsPanMode] = useState(false);
    const [isDraggingWorkspace, setIsDraggingWorkspace] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });
    const [scrollStart, setScrollStart] = useState({ left: 0, top: 0 });

    const [canvasWidth, setCanvasWidth] = useState(842);
    const [canvasHeight, setCanvasHeight] = useState(595);
    const [pageSizePreset, setPageSizePreset] = useState('a4');

    const [canUndo, setCanUndo] = useState(false);
    const [canRedo, setCanRedo] = useState(false);

    const undoStackRef = useRef([]);
    const redoStackRef = useRef([]);
    const isHistoryProcessingRef = useRef(false);

    const fileInputRef = useRef(null);
    const bgInputRef = useRef(null);
    const sigInputRef = useRef(null);
    const isPanModeRef = useRef(isPanMode);
    isPanModeRef.current = isPanMode;

    const saveState = (canvas) => {
        const c = canvas || fabricRef.current;
        if (!c || isHistoryProcessingRef.current) return;
        try {
            const json = JSON.stringify(c.toJSON());
            const stack = undoStackRef.current;
            if (stack.length === 0 || stack[stack.length - 1] !== json) {
                stack.push(json);
                redoStackRef.current = [];
                setCanUndo(stack.length > 1);
                setCanRedo(false);
            }
        } catch (e) {
            console.error("Save state error:", e);
        }
    };

    const handleUndo = () => {
        const canvas = fabricRef.current;
        if (!canvas || undoStackRef.current.length <= 1 || isHistoryProcessingRef.current) return;

        isHistoryProcessingRef.current = true;
        const stack = undoStackRef.current;
        const currentState = stack.pop();
        redoStackRef.current.push(currentState);
        const prevState = stack[stack.length - 1];

        canvas.loadFromJSON(prevState, () => {
            canvas.renderAll();
            isHistoryProcessingRef.current = false;
            setCanUndo(stack.length > 1);
            setCanRedo(redoStackRef.current.length > 0);
            setSelectedObject(null);
        });
    };

    const handleRedo = () => {
        const canvas = fabricRef.current;
        if (!canvas || redoStackRef.current.length === 0 || isHistoryProcessingRef.current) return;

        isHistoryProcessingRef.current = true;
        const nextState = redoStackRef.current.pop();
        undoStackRef.current.push(nextState);

        canvas.loadFromJSON(nextState, () => {
            canvas.renderAll();
            isHistoryProcessingRef.current = false;
            setCanUndo(undoStackRef.current.length > 1);
            setCanRedo(redoStackRef.current.length > 0);
            setSelectedObject(null);
        });
    };

    useEffect(() => {
        if (canvasRef.current && !fabricRef.current) {
            const canvas = new fabric.Canvas(canvasRef.current, {
                height: 595,
                width: 842,
                backgroundColor: '#ffffff',
                selection: true,
                preserveObjectStacking: true,
            });

            fabricRef.current = canvas;
            setFabricCanvas(canvas);

            if (initialTemplate) {
                const imgObj = new Image();
                imgObj.src = initialTemplate;
                imgObj.onload = () => {
                    const imgInstance = new fabric.Image(imgObj);
                    const scaleX = 842 / imgInstance.width;
                    const scaleY = 595 / imgInstance.height;
                    const scale = Math.max(scaleX, scaleY);
                    imgInstance.scale(scale);
                    imgInstance.set({
                        originX: 'center',
                        originY: 'center',
                        left: 421,
                        top: 297,
                        selectable: false,
                        evented: false
                    });
                    canvas.backgroundImage = imgInstance;
                    canvas.renderAll();
                    saveState(canvas);
                };
            } else {
                saveState(canvas);
            }

            canvas.on('selection:created', (e) => setSelectedObject(e.selected[0]));
            canvas.on('selection:updated', (e) => setSelectedObject(e.selected[0]));
            canvas.on('selection:cleared', () => setSelectedObject(null));

            canvas.on('object:modified', () => saveState(canvas));
            canvas.on('object:added', () => saveState(canvas));
            canvas.on('object:removed', () => saveState(canvas));

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

    // Auto-fit canvas zoom perfectly to workspace dimensions (Width + Height Fit)
    const fitCanvasToWorkspace = () => {
        if (workspaceRef.current) {
            const pad = window.innerWidth < 768 ? 24 : 48;
            const availW = workspaceRef.current.clientWidth - pad;
            const availH = workspaceRef.current.clientHeight - pad;
            if (availW > 0 && availH > 0) {
                const scaleX = availW / canvasWidth;
                const scaleY = availH / canvasHeight;
                const bestFit = Math.max(0.25, Math.min(1.2, Math.min(scaleX, scaleY)));
                setZoomLevel(bestFit);
            }
        }
    };

    useEffect(() => {
        fitCanvasToWorkspace();
        window.addEventListener('resize', fitCanvasToWorkspace);
        return () => window.removeEventListener('resize', fitCanvasToWorkspace);
    }, [canvasWidth, canvasHeight]);

    // Change Page Size & Dimensions
    const changePageSize = (preset, customW, customH) => {
        let w = 842;
        let h = 595;

        if (preset === 'a4') {
            w = 842;
            h = 595;
        } else if (preset === 'letter') {
            w = 850;
            h = 650;
        } else if (preset === 'square') {
            w = 600;
            h = 600;
        } else if (preset === 'custom') {
            w = Math.max(300, Math.min(2400, customW || canvasWidth));
            h = Math.max(300, Math.min(2400, customH || canvasHeight));
        }

        setCanvasWidth(w);
        setCanvasHeight(h);
        setPageSizePreset(preset);

        if (fabricCanvas) {
            fabricCanvas.setDimensions({ width: w, height: h });
            if (fabricCanvas.backgroundImage) {
                const img = fabricCanvas.backgroundImage;
                const scaleX = w / img.width;
                const scaleY = h / img.height;
                const scale = Math.max(scaleX, scaleY);
                img.scale(scale);
                img.set({
                    originX: 'center',
                    originY: 'center',
                    left: w / 2,
                    top: h / 2
                });
            }
            fabricCanvas.renderAll();
            saveState();
        }
    };

    // Toggle Pan Mode ON / OFF
    const togglePanMode = () => {
        if (!fabricCanvas) return;
        const newMode = !isPanMode;
        setIsPanMode(newMode);
        isPanModeRef.current = newMode;

        if (newMode) {
            fabricCanvas.selection = false;
            fabricCanvas.defaultCursor = 'grab';
            fabricCanvas.hoverCursor = 'grab';
            fabricCanvas.forEachObject(obj => obj.selectable = false);
            fabricCanvas.discardActiveObject();
            setSelectedObject(null);
        } else {
            fabricCanvas.selection = true;
            fabricCanvas.defaultCursor = 'default';
            fabricCanvas.hoverCursor = 'move';
            fabricCanvas.forEachObject(obj => {
                if (obj.id !== 'frame' && obj.id !== 'gridGroup') {
                    obj.selectable = true;
                }
            });
        }
        fabricCanvas.requestRenderAll();
    };

    // Workspace Container Panning
    const handleWorkspaceMouseDown = (e) => {
        if (isPanMode || e.altKey) {
            setIsDraggingWorkspace(true);
            setPanStart({ x: e.clientX, y: e.clientY });
            if (workspaceRef.current) {
                setScrollStart({
                    left: workspaceRef.current.scrollLeft,
                    top: workspaceRef.current.scrollTop
                });
            }
        }
    };

    const handleWorkspaceMouseMove = (e) => {
        if (isDraggingWorkspace && workspaceRef.current) {
            const dx = e.clientX - panStart.x;
            const dy = e.clientY - panStart.y;
            workspaceRef.current.scrollLeft = scrollStart.left - dx;
            workspaceRef.current.scrollTop = scrollStart.top - dy;
        }
    };

    const handleWorkspaceMouseUp = () => {
        setIsDraggingWorkspace(false);
    };

    const addText = (textStr = 'Your Title Here', options = {}) => {
        if (!fabricCanvas) return;
        const text = new fabric.IText(textStr, {
            left: canvasWidth / 4,
            top: canvasHeight / 3,
            fontFamily: 'Inter, sans-serif',
            fill: '#1e293b',
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
                left: canvasWidth / 2 - 60,
                top: canvasHeight / 2 - 60,
                fill: '#8b5cf6',
                stroke: '#6d28d9',
                strokeWidth: 2,
                width: 120,
                height: 120,
                rx: 8,
                ry: 8
            });
        } else if (type === 'circle') {
            shape = new fabric.Circle({
                left: canvasWidth / 2 - 50,
                top: canvasHeight / 2 - 50,
                fill: '#ec4899',
                stroke: '#be185d',
                strokeWidth: 2,
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
                const scale = Math.min(200 / imgInstance.width, 200 / imgInstance.height);
                imgInstance.scale(scale);
                imgInstance.set({
                    left: (canvasWidth / 2) - (imgInstance.getScaledWidth() / 2),
                    top: (canvasHeight / 2) - (imgInstance.getScaledHeight() / 2)
                });
                fabricCanvas.add(imgInstance);
                fabricCanvas.setActiveObject(imgInstance);
            };
        };
        reader.readAsDataURL(file);
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
                const scaleX = canvasWidth / imgInstance.width;
                const scaleY = canvasHeight / imgInstance.height;
                const scale = Math.max(scaleX, scaleY);

                imgInstance.scale(scale);
                imgInstance.set({
                    originX: 'center',
                    originY: 'center',
                    left: canvasWidth / 2,
                    top: canvasHeight / 2,
                    selectable: false,
                    evented: false
                });

                fabricCanvas.backgroundImage = imgInstance;
                fabricCanvas.renderAll();
                saveState();
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
                const scale = Math.min(150 / imgInstance.width, 100 / imgInstance.height);
                imgInstance.scale(scale);
                imgInstance.set({
                    left: canvasWidth - 250,
                    top: canvasHeight - 150
                });
                fabricCanvas.add(imgInstance);
                fabricCanvas.setActiveObject(imgInstance);
            };
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const toggleGrid = () => {
        if (!fabricCanvas) return;
        setShowGrid(!showGrid);
        let gridGroup = fabricCanvas.getObjects().find(o => o.id === 'gridGroup');

        if (gridGroup) {
            fabricCanvas.remove(gridGroup);
        } else {
            const gridLines = [];
            const gridStep = 20;

            for (let i = 0; i < (canvasWidth / gridStep); i++) {
                gridLines.push(new fabric.Line([i * gridStep, 0, i * gridStep, canvasHeight], { stroke: '#cbd5e1', strokeWidth: 1, selectable: false }));
            }
            for (let i = 0; i < (canvasHeight / gridStep); i++) {
                gridLines.push(new fabric.Line([0, i * gridStep, canvasWidth, i * gridStep], { stroke: '#cbd5e1', strokeWidth: 1, selectable: false }));
            }

            gridGroup = new fabric.Group(gridLines, { id: 'gridGroup', selectable: false, evented: false });
            fabricCanvas.add(gridGroup);
            fabricCanvas.sendObjectToBack(gridGroup);
        }
    };

    const toggleFrame = () => {
        if (!fabricCanvas) return;
        let frame = fabricCanvas.getObjects().find(o => o.id === 'frame');
        if (frame) {
            fabricCanvas.remove(frame);
        } else {
            const rect = new fabric.Rect({
                left: canvasWidth / 2,
                top: canvasHeight / 2,
                fill: 'transparent',
                width: canvasWidth - 160,
                height: canvasHeight - 160,
                stroke: '#7c3aed',
                strokeWidth: 4,
                selectable: false,
                evented: false,
                rx: 10,
                ry: 10,
                id: 'frame',
                originX: 'center',
                originY: 'center'
            });
            fabricCanvas.add(rect);
            fabricCanvas.bringObjectToFront(rect);
        }
    };

    const updateSelectedObject = (prop, value) => {
        if (!fabricCanvas || !selectedObject) return;

        if (prop === 'fill') selectedObject.set('fill', value);
        if (prop === 'stroke') selectedObject.set('stroke', value);
        if (prop === 'strokeWidth') selectedObject.set('strokeWidth', value);
        if (prop === 'fontSize') selectedObject.set('fontSize', parseInt(value));
        if (prop === 'fontFamily') selectedObject.set('fontFamily', value);
        if (prop === 'fontWeight') selectedObject.set('fontWeight', value === 'bold' ? (selectedObject.fontWeight === 'bold' ? 'normal' : 'bold') : value);
        if (prop === 'fontStyle') selectedObject.set('fontStyle', value === 'italic' ? (selectedObject.fontStyle === 'italic' ? 'normal' : 'italic') : value);
        if (prop === 'underline') selectedObject.set('underline', !selectedObject.underline);

        selectedObject.setCoords();
        fabricCanvas.requestRenderAll();
        setSelectedObject({ ...selectedObject });
        saveState();
    };

    const deleteSelected = () => {
        if (!fabricCanvas || !selectedObject) return;
        fabricCanvas.remove(selectedObject);
        fabricCanvas.discardActiveObject();
        fabricCanvas.requestRenderAll();
        setSelectedObject(null);
        saveState();
    };

    const resetCanvas = () => {
        if (!fabricCanvas) return;
        fabricCanvas.clear();
        fabricCanvas.backgroundColor = bgColor;
        setZoomLevel(1);
        saveState();
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
            saveState();
        });
    };

    const loadTemplate = (templateName) => {
        if (!fabricCanvas) return;

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
        saveState();
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
        saveState();
    };

    const changeBgColor = (color) => {
        if (!fabricCanvas) return;

        if (color.startsWith('gradient')) {
            let gradient;
            if (color === 'gradient-sunset') {
                gradient = new fabric.Gradient({
                    type: 'linear',
                    coords: { x1: 0, y1: 0, x2: canvasWidth, y2: canvasHeight },
                    colorStops: [
                        { offset: 0, color: '#f9a8d4' },
                        { offset: 1, color: '#fcd34d' }
                    ]
                });
            } else if (color === 'gradient-ocean') {
                gradient = new fabric.Gradient({
                    type: 'linear',
                    coords: { x1: 0, y1: 0, x2: canvasWidth, y2: canvasHeight },
                    colorStops: [
                        { offset: 0, color: '#67e8f9' },
                        { offset: 1, color: '#3b82f6' }
                    ]
                });
            }
            fabricCanvas.backgroundColor = gradient;
        } else {
            setBgColor(color);
            fabricCanvas.backgroundColor = color;
        }
        fabricCanvas.renderAll();
        saveState();
    };

    const [showSaveModal, setShowSaveModal] = useState(false);
    const [designName, setDesignName] = useState('');
    const [designCategory, setDesignCategory] = useState('Official');

    const handleOpenSaveModal = () => {
        if (!fabricCanvas) return;
        const defaultName = `Certificate Design - ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
        setDesignName(defaultName);
        setShowSaveModal(true);
    };

    const handleConfirmSave = async () => {
        if (!fabricCanvas) return;
        const dataURL = fabricCanvas.toDataURL({
            format: 'png',
            quality: 0.9,
            multiplier: 1.5
        });

        const res = await fetch(dataURL);
        const blob = await res.blob();
        const finalName = designName.trim() || `Design_${Date.now()}`;
        const file = new File([blob], `${finalName}.png`, { type: "image/png" });
        const jsonLayout = fabricCanvas.toJSON();

        setShowSaveModal(false);
        onSave({ file, name: finalName, category: designCategory, json: jsonLayout, previewUrl: dataURL });
    };

    const analyzeDesign = () => {
        if (!fabricCanvas) return;
        setIsAnalyzing(true);

        setTimeout(() => {
            const objects = fabricCanvas.getObjects();
            const suggestions = [];
            let score = 90;

            if (objects.length < 3) {
                suggestions.push("Design looks too empty. Try adding more elements or decorations.");
                score -= 20;
            }

            const hasNameVar = objects.some(o => o.type === 'i-text' && o.text.includes('{{'));
            if (!hasNameVar) {
                suggestions.push("Missing dynamic variable! Add '{{Name Here}}' to make it personal.");
                score -= 30;
            }

            if (bgColor === '#ffffff' || bgColor === '#f8fafc') {
                const lowContrastText = objects.some(o => o.type === 'i-text' && (o.fill === '#ffffff' || o.fill === '#f1f5f9'));
                if (lowContrastText) {
                    suggestions.push("Some text has low contrast against the background. Make it darker.");
                    score -= 15;
                }
            }

            const allLeft = objects.every(o => o.left < 300);
            if (objects.length > 0 && allLeft) {
                suggestions.push("Design feels unbalanced. Try centering your text or adding elements to the right.");
                score -= 10;
            }

            if (suggestions.length === 0) {
                suggestions.push("Great use of negative space!");
                suggestions.push("Font choices look professional.");
                score = 100;
            }

            setAnalysisResult({ score: Math.max(0, score), suggestions });
            setIsAnalyzing(false);
        }, 1200);
    };

    return (
        <div className="flex flex-col h-[calc(100vh-200px)] md:h-[calc(100vh-140px)] min-h-[460px] max-h-[820px] rounded-2xl overflow-hidden border border-[var(--border-muted)] bg-[var(--bg-card)] shadow-xl mb-16 md:mb-0">
            {/* Top Toolbar - Properties & Formatting (Flex Wrap Without Scrollbars) */}
            <div className="bg-white border-b border-slate-200 p-2.5 flex flex-wrap items-center gap-3 min-h-[3.5rem] px-6 z-10">
                <div className="font-black text-slate-700 mr-2 flex items-center gap-2 flex-shrink-0 text-xs uppercase tracking-wider">
                    <Palette className="text-violet-600" size={18} /> Studio Tools
                </div>

                {/* Undo / Redo Actions */}
                <div className="flex gap-1 mr-2 flex-shrink-0">
                    <button
                        onClick={handleUndo}
                        disabled={!canUndo}
                        className={`p-1.5 rounded-lg border transition-all flex items-center gap-1 text-xs font-bold ${
                            canUndo ? 'hover:bg-slate-100 text-slate-700 border-slate-200 active:scale-95' : 'text-slate-300 border-slate-100 cursor-not-allowed opacity-50'
                        }`}
                        title="Undo Action (Ctrl+Z)"
                    >
                        <RotateCcw size={15} />
                        <span className="hidden sm:inline">Undo</span>
                    </button>

                    <button
                        onClick={handleRedo}
                        disabled={!canRedo}
                        className={`p-1.5 rounded-lg border transition-all flex items-center gap-1 text-xs font-bold ${
                            canRedo ? 'hover:bg-slate-100 text-slate-700 border-slate-200 active:scale-95' : 'text-slate-300 border-slate-100 cursor-not-allowed opacity-50'
                        }`}
                        title="Redo Action (Ctrl+Y)"
                    >
                        <RotateCw size={15} />
                        <span className="hidden sm:inline">Redo</span>
                    </button>
                </div>

                <div className="h-6 w-px bg-slate-200 mx-1 flex-shrink-0" />

                {/* Page Size & Dimensions Selector */}
                <div className="flex items-center gap-2 mr-2 flex-shrink-0">
                    <FileText size={16} className="text-amber-500" />
                    <select
                        value={pageSizePreset}
                        onChange={(e) => changePageSize(e.target.value)}
                        className="bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-700 outline-none cursor-pointer"
                        title="Select Certificate Page Format"
                    >
                        <option value="a4">A4 Landscape (842 x 595 px)</option>
                        <option value="letter">US Letter (850 x 650 px)</option>
                        <option value="square">Square Badge (600 x 600 px)</option>
                        <option value="custom">⚙️ Custom Dimensions</option>
                    </select>

                    {pageSizePreset === 'custom' && (
                        <div className="flex items-center gap-1 font-mono text-xs">
                            <span className="text-slate-400 font-bold text-[10px]">W:</span>
                            <input
                                type="number"
                                value={canvasWidth}
                                onChange={(e) => changePageSize('custom', parseInt(e.target.value), canvasHeight)}
                                className="w-16 px-1.5 py-1 border border-slate-200 rounded-lg text-center font-bold focus:outline-none focus:border-violet-500"
                            />
                            <span className="text-slate-400 font-bold">×</span>
                            <span className="text-slate-400 font-bold text-[10px]">H:</span>
                            <input
                                type="number"
                                value={canvasHeight}
                                onChange={(e) => changePageSize('custom', canvasWidth, parseInt(e.target.value))}
                                className="w-16 px-1.5 py-1 border border-slate-200 rounded-lg text-center font-bold focus:outline-none focus:border-violet-500"
                            />
                        </div>
                    )}
                </div>

                <div className="h-6 w-px bg-slate-200 mx-1 flex-shrink-0" />

                <div className="flex gap-1.5 mr-2 flex-shrink-0">
                    <button onClick={toggleFrame} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 border border-slate-200" title="Toggle Outer Frame">
                        <Square size={16} className="text-violet-500" />
                    </button>
                    <button onClick={toggleGrid} className={`p-1.5 hover:bg-slate-100 rounded-lg border border-slate-200 ${showGrid ? 'bg-violet-50 text-violet-600' : 'text-slate-600'}`} title="Toggle Alignment Grid">
                        <LayoutTemplate size={16} />
                    </button>
                    <button
                        onClick={togglePanMode}
                        className={`p-1.5 rounded-lg border transition-all flex items-center gap-1 text-xs font-bold ${isPanMode ? 'bg-amber-500 text-white border-amber-600 shadow-md' : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'}`}
                        title={isPanMode ? 'Pan Mode Active (Click and drag canvas workspace to scroll)' : 'Activate Hand Mode (Move workspace view safely)'}
                    >
                        <Hand size={16} />
                        <span className="hidden sm:inline">{isPanMode ? 'Pan Active' : 'Hand'}</span>
                    </button>
                </div>

                <div className="h-6 w-px bg-slate-200 mx-1 flex-shrink-0" />

                {selectedObject ? (
                    <>
                        {/* Alignment Actions */}
                        <div className="flex gap-1 mr-2 flex-shrink-0">
                            <button onClick={() => alignObject('centerH')} title="Center Horizontally" className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600">
                                <AlignHorizontalJustifyCenter size={16} />
                            </button>
                            <button onClick={() => alignObject('centerV')} title="Center Vertically" className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600">
                                <AlignVerticalJustifyCenter size={16} />
                            </button>
                            <button onClick={() => alignObject('center')} title="Center Both Axes" className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600">
                                <AlignCenter size={16} />
                            </button>
                        </div>

                        <div className="flex items-center gap-2 border-l border-slate-200 pl-3 mr-2">
                            <button onClick={duplicateSelected} title="Duplicate Selected Element" className="flex items-center gap-1 px-2.5 py-1 bg-violet-50 text-violet-600 rounded-lg hover:bg-violet-100 transition-colors font-bold text-xs border border-violet-200">
                                <RefreshCw size={12} /> Duplicate
                            </button>
                        </div>

                        {/* Shape Fill & Outline Color Pickers (Only for Vector Shapes) */}
                        {['rect', 'circle', 'triangle', 'polygon', 'path'].includes(selectedObject.type) && (
                            <div className="flex items-center gap-3 border-l border-slate-200 pl-3 mr-2">
                                <div className="flex items-center gap-1.5" title="Fill Color (Solid or Transparent)">
                                    <span className="text-[10px] font-black uppercase text-slate-400">Fill</span>
                                    <input
                                        type="color"
                                        value={selectedObject.fill && typeof selectedObject.fill === 'string' && selectedObject.fill !== 'transparent' ? selectedObject.fill : '#ffffff'}
                                        onChange={(e) => updateSelectedObject('fill', e.target.value)}
                                        className="w-7 h-7 rounded-lg cursor-pointer border border-slate-200 p-0 overflow-hidden"
                                        disabled={selectedObject.fill === 'transparent'}
                                    />
                                    <button
                                        onClick={() => updateSelectedObject('fill', selectedObject.fill === 'transparent' ? '#8b5cf6' : 'transparent')}
                                        className={`px-2 py-1 rounded-lg text-[10px] font-black border transition-all ${
                                            selectedObject.fill === 'transparent'
                                                ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
                                        }`}
                                        title="Toggle Transparent / No Fill"
                                    >
                                        {selectedObject.fill === 'transparent' ? '🚫 No Fill' : 'Solid'}
                                    </button>
                                </div>

                                <div className="flex items-center gap-1.5" title="Outline / Stroke Color">
                                    <span className="text-[10px] font-black uppercase text-slate-400">Outline</span>
                                    <input
                                        type="color"
                                        value={selectedObject.stroke || '#000000'}
                                        onChange={(e) => updateSelectedObject('stroke', e.target.value)}
                                        className="w-7 h-7 rounded-lg cursor-pointer border border-slate-200 p-0 overflow-hidden"
                                    />
                                </div>

                                <div className="flex items-center gap-1" title="Outline Thickness">
                                    <span className="text-[10px] font-black uppercase text-slate-400">Width</span>
                                    <select
                                        value={selectedObject.strokeWidth || 0}
                                        onChange={(e) => updateSelectedObject('strokeWidth', parseInt(e.target.value))}
                                        className="bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 outline-none"
                                    >
                                        <option value={0}>0px</option>
                                        <option value={1}>1px</option>
                                        <option value={2}>2px</option>
                                        <option value={3}>3px</option>
                                        <option value={5}>5px</option>
                                        <option value={8}>8px</option>
                                        <option value={10}>10px</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        {/* Text Specific Property Controls */}
                        {selectedObject.type === 'i-text' && (
                            <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
                                <CustomSelect
                                    value={selectedObject.fontFamily}
                                    onChange={(val) => updateSelectedObject('fontFamily', val)}
                                    options={FONTS}
                                    className="w-32"
                                />
                                <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
                                    <button
                                        onClick={() => updateSelectedObject('fontSize', Math.max(8, selectedObject.fontSize - 2))}
                                        className="p-1.5 hover:bg-slate-100 text-slate-500 border-r border-slate-200"
                                    >
                                        <Minus size={14} />
                                    </button>
                                    <input
                                        type="number"
                                        value={selectedObject.fontSize}
                                        onChange={(e) => updateSelectedObject('fontSize', e.target.value)}
                                        className="w-10 py-1 text-center text-xs font-bold focus:outline-none"
                                    />
                                    <button
                                        onClick={() => updateSelectedObject('fontSize', selectedObject.fontSize + 2)}
                                        className="p-1.5 hover:bg-slate-100 text-slate-500 border-l border-slate-200"
                                    >
                                        <Plus size={14} />
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="ml-auto">
                            <button onClick={deleteSelected} className="text-rose-600 hover:text-rose-700 text-xs font-black uppercase tracking-wider px-3 py-1.5 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors border border-rose-200">
                                Delete Element
                            </button>
                        </div>
                    </>
                ) : null}
            </div>

            <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
                {/* Left Sidebar / Top Mobile Tools Ribbon */}
                <div className="w-full md:w-24 bg-white border-b md:border-b-0 md:border-r border-slate-200 flex flex-row md:flex-col items-center p-2 md:py-4 gap-2 z-10 shadow-sm overflow-x-auto md:overflow-y-auto shrink-0 custom-scrollbar">
                    <div className="hidden md:block w-full px-2 mb-1"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Insert</span></div>

                    <button onClick={() => addText('Text')} className="flex flex-col md:flex-col items-center justify-center gap-1 p-1.5 md:p-2 text-slate-500 hover:text-violet-600 hover:bg-violet-50 rounded-xl w-14 md:w-20 shrink-0 transition-all group">
                        <Type size={16} className="group-hover:scale-110 transition-transform" />
                        <span className="text-[9px] md:text-[10px] font-bold">Text</span>
                    </button>

                    <button onClick={() => addShape('rect')} className="flex flex-col md:flex-col items-center justify-center gap-1 p-1.5 md:p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl w-14 md:w-20 shrink-0 transition-all group">
                        <Square size={16} className="group-hover:scale-110 transition-transform" />
                        <span className="text-[9px] md:text-[10px] font-bold">Box</span>
                    </button>

                    <button onClick={() => addShape('circle')} className="flex flex-col md:flex-col items-center justify-center gap-1 p-1.5 md:p-2 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-xl w-14 md:w-20 shrink-0 transition-all group">
                        <Circle size={16} className="group-hover:scale-110 transition-transform" />
                        <span className="text-[9px] md:text-[10px] font-bold">Circle</span>
                    </button>

                    <button onClick={() => fileInputRef.current.click()} className="flex flex-col md:flex-col items-center justify-center gap-1 p-1.5 md:p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl w-14 md:w-20 shrink-0 transition-all group">
                        <ImageIcon size={16} className="group-hover:scale-110 transition-transform" />
                        <span className="text-[9px] md:text-[10px] font-bold">Image</span>
                        <input
                            type="file"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            accept="image/*"
                            onChange={handleImageUpload}
                        />
                    </button>

                    <button onClick={() => sigInputRef.current.click()} className="flex flex-col md:flex-col items-center justify-center gap-1 p-1.5 md:p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl w-14 md:w-20 shrink-0 transition-all group">
                        <MousePointer2 size={16} className="group-hover:scale-110 transition-transform" />
                        <span className="text-[9px] md:text-[10px] font-bold">Signature</span>
                        <input
                            type="file"
                            ref={sigInputRef}
                            style={{ display: 'none' }}
                            accept="image/png"
                            onChange={handleSignatureUpload}
                        />
                    </button>

                    <div className="h-6 w-px md:w-16 md:h-px bg-slate-200 mx-1 md:my-2 shrink-0" />
                    <div className="hidden md:block w-full px-2 mb-1"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Layouts</span></div>

                    <button onClick={() => loadTemplate('corporate')} className="flex flex-col md:flex-col items-center justify-center gap-1 p-1.5 md:p-2 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-xl w-14 md:w-20 shrink-0 transition-all group">
                        <LayoutTemplate size={16} className="group-hover:scale-110 transition-transform text-amber-500" />
                        <span className="text-[9px] md:text-[10px] font-bold">Modern</span>
                    </button>
                    <button onClick={() => loadTemplate('academic')} className="flex flex-col md:flex-col items-center justify-center gap-1 p-1.5 md:p-2 text-slate-500 hover:text-violet-600 hover:bg-violet-50 rounded-xl w-14 md:w-20 shrink-0 transition-all group">
                        <LayoutTemplate size={16} className="group-hover:scale-110 transition-transform text-violet-500" />
                        <span className="text-[9px] md:text-[10px] font-bold">Elegant</span>
                    </button>
                    <button onClick={() => loadTemplate('premium')} className="flex flex-col md:flex-col items-center justify-center gap-1 p-1.5 md:p-2 text-slate-500 hover:text-yellow-600 hover:bg-yellow-50 rounded-xl w-14 md:w-20 shrink-0 transition-all group">
                        <LayoutTemplate size={16} className="group-hover:scale-110 transition-transform text-yellow-500" />
                        <span className="text-[9px] md:text-[10px] font-bold">Luxury</span>
                    </button>

                    <div className="h-6 w-px md:w-16 md:h-px bg-slate-200 mx-1 md:my-2 shrink-0" />

                    <div className="flex flex-row md:flex-col gap-1.5 md:gap-2 items-center shrink-0">
                        <span className="hidden md:block text-[10px] font-black uppercase text-slate-400 mb-1">Canvas RGB</span>
                        <div className="flex flex-row md:grid md:grid-cols-2 gap-1.5">
                            {['#ffffff', '#fdf2f8', '#eff6ff', '#f0fdf4', '#fffbeb', '#1e293b'].map(c => (
                                <button
                                    key={c}
                                    onClick={() => changeBgColor(c)}
                                    className={`w-4.5 h-4.5 md:w-5 md:h-5 rounded-full border border-slate-200 shadow-sm hover:scale-110 transition-transform ${bgColor === c ? 'ring-2 ring-violet-500 ring-offset-1' : ''}`}
                                    style={{ backgroundColor: c }}
                                    title={c}
                                />
                            ))}
                        </div>
                        <button onClick={() => bgInputRef.current.click()} className="text-[9px] md:text-[10px] font-bold text-violet-600 hover:underline flex items-center gap-1 shrink-0 ml-1 md:ml-0 md:mt-1">
                            <ImageIcon size={12} /> Custom BG
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

                {/* Main Canvas Workspace Container (Perfect Centering Without Layout Gaps) */}
                <div
                    ref={workspaceRef}
                    onMouseDown={handleWorkspaceMouseDown}
                    onMouseMove={handleWorkspaceMouseMove}
                    onMouseUp={handleWorkspaceMouseUp}
                    onMouseLeave={handleWorkspaceMouseUp}
                    className={`flex-1 bg-slate-950/30 flex items-center justify-center relative overflow-auto p-3 sm:p-6 md:p-8 select-none ${isPanMode ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
                >
                    {/* Floating Zoom & Pan Controls Bar (Absolute Bottom Right Overlay) */}
                    <div className="absolute bottom-3 right-3 bg-slate-900/90 backdrop-blur-md text-white px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-2 shadow-2xl text-xs font-bold z-30">
                        <button
                            onClick={togglePanMode}
                            className={`p-1.5 rounded-lg transition-all flex items-center gap-1 text-xs font-bold ${isPanMode ? 'bg-amber-500 text-white shadow-md' : 'text-slate-300 hover:text-white hover:bg-white/10'}`}
                            title={isPanMode ? 'Pan Mode Active (Drag workspace view)' : 'Activate Hand Mode'}
                        >
                            <Hand size={14} />
                            <span className="text-[10px] uppercase font-black">{isPanMode ? 'Pan ON' : 'Hand'}</span>
                        </button>

                        <div className="w-px h-4 bg-white/20 mx-0.5" />

                        <button
                            onClick={() => setZoomLevel(prev => Math.max(0.2, Math.round((prev - 0.15) * 100) / 100))}
                            className="p-1 hover:bg-white/10 rounded transition-all text-slate-300 hover:text-white"
                            title="Zoom Out (Ctrl -)"
                        >
                            <ZoomOut size={14} />
                        </button>
                        <span className="w-12 text-center font-mono text-[11px] text-amber-400 font-bold">{Math.round(zoomLevel * 100)}%</span>
                        <button
                            onClick={() => setZoomLevel(prev => Math.min(2.5, Math.round((prev + 0.15) * 100) / 100))}
                            className="p-1 hover:bg-white/10 rounded transition-all text-slate-300 hover:text-white"
                            title="Zoom In (Ctrl +)"
                        >
                            <ZoomIn size={14} />
                        </button>
                        <div className="w-px h-4 bg-white/20 mx-0.5" />
                        <button
                            onClick={() => setZoomLevel(1)}
                            className={`px-1.5 py-0.5 rounded transition-all flex items-center gap-1 text-[10px] font-black uppercase ${zoomLevel === 1 ? 'bg-violet-600 text-white shadow-md' : 'text-slate-300 hover:bg-white/10'}`}
                            title="1:1 Full Scale 100%"
                        >
                            100%
                        </button>
                        <button
                            onClick={fitCanvasToWorkspace}
                            className="px-1.5 py-0.5 hover:bg-white/10 rounded transition-all text-violet-400 hover:text-violet-300 flex items-center gap-1 text-[10px] font-black uppercase"
                            title="Fit Canvas to Viewport"
                        >
                            <Maximize2 size={12} /> Fit
                        </button>
                    </div>

                    {/* Perfectly Centered Scaled Certificate Paper (Exact A4 Landscape 842x595 Aspect Ratio) */}
                    <div
                        className="relative shadow-2xl rounded-none overflow-hidden transition-all duration-150 border border-white/20 shrink-0 m-auto"
                        style={{
                            width: canvasWidth,
                            height: canvasHeight,
                            transform: `scale(${zoomLevel})`,
                            transformOrigin: 'center center',
                            margin: `${((zoomLevel - 1) * canvasHeight) / 2}px ${((zoomLevel - 1) * canvasWidth) / 2}px`
                        }}
                    >
                        <canvas ref={canvasRef} />
                    </div>
                </div>
            </div>

            {/* Bottom Action Toolbar */}
            <div className="min-h-[3.5rem] bg-white border-t border-slate-200 px-3 sm:px-6 py-2 flex items-center justify-end gap-2 z-10 shrink-0 overflow-x-auto">

                <div className="flex gap-2 items-center shrink-0">
                    <button
                        onClick={analyzeDesign}
                        disabled={isAnalyzing}
                        className={`flex items-center gap-1.5 px-3 sm:px-5 py-2 font-black text-xs uppercase tracking-wider rounded-xl border transition-all ${isAnalyzing ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-gradient-to-r from-rose-600 to-violet-600 text-white border-transparent shadow-lg hover:from-rose-500 hover:to-violet-500'}`}
                    >
                        {isAnalyzing ? (
                            <>
                                <RefreshCw size={15} className="animate-spin" />
                                <span>Analyzing...</span>
                            </>
                        ) : (
                            <>
                                <Sparkles size={15} />
                                <span>AI Analyze</span>
                                <span className="hidden sm:inline-block text-[9px] bg-white/20 px-1.5 py-0.5 rounded font-mono ml-0.5">BETA</span>
                            </>
                        )}
                    </button>
                    <div className="w-px h-6 bg-slate-200 mx-0.5 hidden sm:block" />
                    <button onClick={onCancel} className="px-2.5 sm:px-4 py-2 text-slate-600 font-bold text-xs uppercase tracking-wider hover:bg-slate-100 rounded-xl transition-colors shrink-0">
                        Cancel
                    </button>
                    <button onClick={handleOpenSaveModal} className="flex items-center gap-1.5 px-3.5 sm:px-6 py-2 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all active:scale-95 shrink-0">
                        <Check size={15} />
                        <span className="hidden sm:inline">Finish & Save Design</span>
                        <span className="sm:hidden">Save</span>
                    </button>
                </div>
            </div>

            {/* Save Design Template Modal */}
            {showSaveModal && (
                <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setShowSaveModal(false)}>
                    <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 p-6 space-y-5" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2 text-violet-600">
                                <Award size={22} />
                                <h3 className="text-lg font-black text-slate-800 tracking-tight">Name Your Design Template</h3>
                            </div>
                            <button onClick={() => setShowSaveModal(false)} className="p-1 text-slate-400 hover:text-slate-700 rounded-lg">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-black uppercase text-slate-500 mb-1.5">Design Template Name</label>
                                <input
                                    type="text"
                                    value={designName}
                                    onChange={(e) => setDesignName(e.target.value)}
                                    placeholder="e.g. Masterclass Achievement Certificate"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:border-violet-500 focus:bg-white transition-all"
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-black uppercase text-slate-500 mb-1.5">Template Tag</label>
                                <div className="flex flex-wrap gap-2">
                                    {['Official', 'University', 'Corporate', 'Workshop', 'Achievement'].map(cat => (
                                        <button
                                            key={cat}
                                            type="button"
                                            onClick={() => setDesignCategory(cat)}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${designCategory === cat ? 'bg-violet-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                            <button onClick={() => setShowSaveModal(false)} className="px-4 py-2.5 text-slate-600 font-bold text-xs uppercase tracking-wider hover:bg-slate-100 rounded-xl transition-colors">
                                Cancel
                            </button>
                            <button onClick={handleConfirmSave} className="flex items-center gap-1.5 px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all active:scale-95">
                                <Check size={16} /> Confirm & Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* AI Analysis Result Modal */}
            {analysisResult && (
                <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">
                        <div className="bg-gradient-to-r from-rose-600 to-violet-600 p-6 text-white">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-white/20 rounded-xl">
                                    <Sparkles size={24} className="text-white" />
                                </div>
                                <h3 className="text-xl font-black tracking-tight">AI Design Critique</h3>
                            </div>
                            <p className="text-white/80 text-xs font-semibold">Powered by Pramanit Layout Intelligence</p>
                        </div>
                        <div className="p-6 space-y-4">
                            {analysisResult.score >= 80 ? (
                                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex gap-3 text-emerald-800">
                                    <Check size={20} className="shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-bold text-xs uppercase tracking-wider">Excellent Design! ({analysisResult.score}/100)</p>
                                        <p className="text-xs opacity-80 mt-1 font-medium">Ready for production. Good balance and contrast.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex gap-3 text-amber-800">
                                    <Triangle size={20} className="shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-bold text-xs uppercase tracking-wider">Needs Improvement ({analysisResult.score}/100)</p>
                                        <p className="text-xs opacity-80 mt-1 font-medium">Review the suggestions below before issuing.</p>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Suggestions</h4>
                                {analysisResult.suggestions.map((s, i) => (
                                    <div key={i} className="flex gap-2 text-xs font-medium text-slate-600 items-start">
                                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                                        {s}
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={() => setAnalysisResult(null)}
                                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xs uppercase tracking-wider rounded-xl transition-colors mt-4"
                            >
                                Close & Continue Editing
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CertificateDesigner;
