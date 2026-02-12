import React, { useState, useRef, useEffect } from 'react';
import Draggable from 'react-draggable';
import { Type, Move } from 'lucide-react';

const CertificatePreview = ({ templateFile, onPositionChange, initialPosition }) => {
    const [imageUrl, setImageUrl] = useState(null);
    const imageRef = useRef(null);
    const containerRef = useRef(null);
    const nodeRef = useRef(null);
    const [position, setPosition] = useState(initialPosition || { x: 0, y: 0 }); // Visual position
    const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

    useEffect(() => {
        if (templateFile) {
            const url = URL.createObjectURL(templateFile);
            setImageUrl(url);
            return () => URL.revokeObjectURL(url);
        }
    }, [templateFile]);

    const handleImageLoad = (e) => {
        setImageSize({ width: e.target.naturalWidth, height: e.target.naturalHeight });
        // Center initial position if 0,0
        if (position.x === 0 && position.y === 0 && containerRef.current) {
            const { clientWidth, clientHeight } = containerRef.current;
            setPosition({ x: clientWidth / 2 - 100, y: clientHeight / 2 });
        }
    };

    const handleDrag = (e, data) => {
        setPosition({ x: data.x, y: data.y });
    };

    const handleStop = (e, data) => {
        // Calculate position relative to the ACTUAL image natural size
        // We need to scale the visual coordinates to the natural image coordinates
        if (!imageRef.current) return;

        const visualImage = imageRef.current;
        const scaleX = visualImage.naturalWidth / visualImage.clientWidth;
        const scaleY = visualImage.naturalHeight / visualImage.clientHeight;

        // The draggable is inside the container, overlaying the image.
        // We need to find the text center point relative to the image top-left.

        const realX = data.x * scaleX;
        const realY = data.y * scaleY;

        // Adjust for centering (draggable default top-left) if needed, but for now sending raw TL
        // Ideally we want the center of the text or baseline.
        // Let's assume user drags top-left of the text box.

        onPositionChange({ x: realX, y: realY });
    };

    return (
        <div className="w-full max-w-4xl mx-auto bg-gray-900 rounded-xl overflow-hidden shadow-2xl">
            <div className="bg-gray-800 p-3 px-6 flex justify-between items-center border-b border-gray-700">
                <h3 className="text-gray-200 font-medium flex items-center gap-2">
                    <Type size={16} className="text-violet-400" />
                    Certificate Preview
                </h3>
                <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Move size={12} />
                    Drag the name to position
                </span>
            </div>

            <div className="relative overflow-auto p-4 flex justify-center bg-gray-700/50 min-h-[400px]" ref={containerRef}>
                {imageUrl ? (
                    <div className="relative inline-block shadow-lg">
                        <img
                            ref={imageRef}
                            src={imageUrl}
                            alt="Certificate Template"
                            className="max-w-full h-auto block select-none"
                            onLoad={handleImageLoad}
                            draggable={false}
                        />

                        <Draggable
                            bounds="parent"
                            position={position}
                            onDrag={handleDrag}
                            onStop={handleStop}
                            nodeRef={nodeRef}
                        >
                            <div ref={nodeRef} className="absolute top-0 left-0 cursor-move group">
                                <div className="bg-violet-600/20 border-2 border-violet-500 border-dashed rounded px-4 py-2 text-violet-100 font-bold text-xl whitespace-nowrap shadow-sm group-hover:bg-violet-600/40 transition-colors backdrop-blur-sm">
                                    Recipient Name
                                </div>
                                {/* Crosshair indicator for precision */}
                                <div className="absolute top-0 left-0 w-3 h-0.5 bg-violet-500 -translate-x-1 -translate-y-px"></div>
                                <div className="absolute top-0 left-0 w-0.5 h-3 bg-violet-500 -translate-x-px -translate-y-1"></div>
                            </div>
                        </Draggable>
                    </div>
                ) : (
                    <div className="flex items-center justify-center text-gray-500 h-64 w-full">
                        No template selected
                    </div>
                )}
            </div>
            <div className="bg-gray-800 p-3 px-6 text-xs text-gray-500 flex justify-between">
                <span>Natural Size: {imageSize.width} x {imageSize.height}</span>
                <span>Pos: {Math.round(position.x)}, {Math.round(position.y)}</span>
            </div>
        </div>
    );
};

export default CertificatePreview;
