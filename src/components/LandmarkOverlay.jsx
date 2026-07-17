import React, { useRef, useEffect } from 'react';

const LandmarkOverlay = ({ handsData, width, height, isMirrored }) => {
  const canvasRef = useRef(null);

  // Hand joints connections map
  const connections = [
    // Thumb
    [0, 1], [1, 2], [2, 3], [3, 4],
    // Index finger
    [0, 5], [5, 6], [6, 7], [7, 8],
    // Middle finger
    [0, 9], [9, 10], [10, 11], [11, 12],
    // Ring finger
    [0, 13], [13, 14], [14, 15], [15, 16],
    // Pinky
    [0, 17], [17, 18], [18, 19], [19, 20],
    // Knuckles connecting palm
    [5, 9], [9, 13], [13, 17]
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear previous frame
    ctx.clearRect(0, 0, width, height);

    if (!handsData || handsData.length === 0) return;

    // Set line and circle draw parameters
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';

    handsData.forEach((hand) => {
      const landmarks = hand.landmarks; // Array of 21 points {x, y, z}
      const isRightHand = hand.handedness === 'Right';
      
      // Select drawing color based on handedness
      const jointColor = isRightHand ? '#10b981' : '#708a9e'; // Green vs Blue-grey
      const connectionColor = isRightHand ? 'rgba(16, 185, 129, 0.4)' : 'rgba(112, 138, 158, 0.4)';

      // 1. Draw connections (lines)
      ctx.strokeStyle = connectionColor;
      connections.forEach(([from, to]) => {
        const ptFrom = landmarks[from];
        const ptTo = landmarks[to];

        if (ptFrom && ptTo) {
          ctx.beginPath();
          // Scale landmarks (which are 0.0 to 1.0) to canvas dimensions
          // If video is mirrored in UI, we mirror x coordinates on drawing
          let fromX = ptFrom.x * width;
          let toX = ptTo.x * width;
          
          if (isMirrored) {
            fromX = width - fromX;
            toX = width - toX;
          }

          ctx.moveTo(fromX, ptFrom.y * height);
          ctx.lineTo(toX, ptTo.y * height);
          ctx.stroke();
        }
      });

      // 2. Draw joints (circles)
      landmarks.forEach((landmark, index) => {
        let x = landmark.x * width;
        if (isMirrored) {
          x = width - x;
        }
        const y = landmark.y * height;

        ctx.beginPath();
        // Highlight finger tips and wrist
        const isEndpoint = [0, 4, 8, 12, 16, 20].includes(index);
        ctx.arc(x, y, isEndpoint ? 6 : 4, 0, 2 * Math.PI);
        ctx.fillStyle = isEndpoint ? '#ef4444' : jointColor; // Red tips
        ctx.fill();
        
        // Draw a outer border ring around endpoint tips
        if (isEndpoint) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.lineWidth = 3; // Reset
        }
      });
    });
  }, [handsData, width, height, isMirrored]);

  return (
    <canvas 
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        pointerEvents: 'none', // Allow clicks to pass through to video/buttons underneath
        zIndex: 5
      }}
      className="landmark-canvas-overlay"
    />
  );
};

export default LandmarkOverlay;
