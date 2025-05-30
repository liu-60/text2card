import React, { useEffect, useRef, useState } from "react";
import { ColorTheme } from "../app/colorThemes";

interface TextPreviewProps {
    text: string;
    fontsLoaded: boolean;
    randomLayout: boolean;
    theme: ColorTheme;
    isPortraitMode: boolean;
}

const TextPreview: React.FC<TextPreviewProps> = ({ text, fontsLoaded, randomLayout, theme, isPortraitMode }) => {
    const previewRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const [fontSizes, setFontSizes] = useState<number[]>([]);
    const [yPositions, setYPositions] = useState<number[]>([]);
    const [previewSize, setPreviewSize] = useState({ width: 0, height: 0 });

    const getRandomFontSize = (baseSize: number) => {
        return Math.floor(Math.random() * (baseSize * 2 - baseSize / 4 + 1) + baseSize / 4);
    };

    const regenerateFontSizes = (baseSize: number) => {
        return text.split('\n\n\n').map(() => getRandomFontSize(baseSize));
    };

    const generateRandomYPositions = (containerHeight: number, paragraphHeights: number[], virtualPadding: number) => {
        const positions: number[] = [];
        const totalContentHeight = paragraphHeights.reduce((sum, height) => sum + height, 0);
        const availableSpace = containerHeight - totalContentHeight - 2 * virtualPadding;
        const minGap = containerHeight * 0.05; // Minimum gap between paragraphs (5% of container height)

        let currentY = virtualPadding; // Start after virtual padding
        paragraphHeights.forEach((height, index) => {
            if (index === 0) {
                positions.push(currentY); // First paragraph starts after virtual padding
                currentY += height;
            } else {
                const maxOffset = availableSpace / (paragraphHeights.length - 1);
                let randomOffset = Math.random() * maxOffset;
                if (randomOffset < minGap) randomOffset = minGap;
                currentY += randomOffset;
                positions.push(currentY);
                currentY += height;
            }
        });

        return positions;
    };

    const checkAndAdjustLayout = () => {
        if (!previewRef.current || !contentRef.current) return;

        const containerWidth = previewRef.current.offsetWidth;
        const containerHeight = previewRef.current.offsetHeight;
        const baseFontSize = Math.min(containerWidth, containerHeight) * 0.07;

        const innerPadding = containerWidth * 0.06;
        const totalHorizontalPadding = 2 * innerPadding;
        const totalVerticalPadding = 2 * innerPadding;

        // Add virtual padding
        const virtualPadding = containerHeight * 0.05;

        let newFontSizes = regenerateFontSizes(baseFontSize);
        let attempts = 0;
        const maxAttempts = 100;

        while (attempts < maxAttempts) {
            contentRef.current.style.fontSize = `${baseFontSize}px`;
            const paragraphHeights: number[] = [];

            newFontSizes.forEach((size, index) => {
                const paragraph = contentRef.current!.children[index] as HTMLParagraphElement;
                if (paragraph) {
                    paragraph.style.fontSize = `${size}px`;
                    paragraph.style.position = 'absolute';
                    paragraph.style.width = `${containerWidth - totalHorizontalPadding}px`;
                    paragraphHeights.push(paragraph.offsetHeight);
                }
            });

            const newYPositions = generateRandomYPositions(containerHeight - totalVerticalPadding, paragraphHeights, virtualPadding);

            let isOverlapping = false;
            for (let i = 0; i < newYPositions.length; i++) {
                for (let j = i + 1; j < newYPositions.length; j++) {
                    if (Math.abs(newYPositions[i] - newYPositions[j]) < Math.max(paragraphHeights[i], paragraphHeights[j])) {
                        isOverlapping = true;
                        break;
                    }
                }
                if (isOverlapping) break;
            }

            let isOverflowing = newYPositions[newYPositions.length - 1] + paragraphHeights[paragraphHeights.length - 1] > containerHeight - totalVerticalPadding - virtualPadding;

            if (!isOverlapping && !isOverflowing) {
                setFontSizes(newFontSizes);
                setYPositions(newYPositions);
                break;
            }

            newFontSizes = newFontSizes.map(size => Math.max(size * 0.9, baseFontSize / 4));
            attempts++;
        }

        if (attempts === maxAttempts) {
            const fallbackFontSize = baseFontSize / 2;
            setFontSizes(newFontSizes.map(() => fallbackFontSize));
            const fallbackYPositions = text.split('\n\n\n').map((_, index) =>
                virtualPadding + index * (fallbackFontSize * 1.5)
            );
            setYPositions(fallbackYPositions);
        }
    };

    const updatePreviewSize = () => {
        if (previewRef.current) {
            const width = previewRef.current.offsetWidth;
            const height = isPortraitMode ? width * 1.414 : width / 1.618;
            setPreviewSize({ width, height });
        }
    };

    useEffect(() => {
        updatePreviewSize();
        window.addEventListener('resize', updatePreviewSize);
        return () => window.removeEventListener('resize', updatePreviewSize);
    }, [isPortraitMode]);

    useEffect(() => {
        checkAndAdjustLayout();
    }, [text, randomLayout, previewSize, isPortraitMode]);

    const getBorderRadius = () => {
        return `${previewSize.width * 0.03}px`;
    };

    const getPadding = () => {
        return `${previewSize.width * 0.06}px`;
    };

    return (
        <div
            className="w-full box-border"
            style={{
                backgroundColor: theme.borderBackground,
                padding: `${previewSize.width * 0.03}px`,
                borderRadius: `${previewSize.width * 0.025}px`,
            }}
        >
            <div
                ref={previewRef}
                className="text-preview w-full relative overflow-hidden"
                style={{
                    backgroundColor: theme.cardBackground,
                    borderRadius: getBorderRadius(),
                    padding: getPadding(),
                    height: `${previewSize.height}px`,
                }}
            >
                <div
                    ref={contentRef}
                    className="relative w-full h-full break-words whitespace-pre-wrap overflow-hidden"
                    style={{
                        color: theme.textColor,
                        fontFamily: fontsLoaded ? 'Huiwen_mingchao, sans-serif' : 'sans-serif',
                    }}
                >
                    {text.split('\n\n').map((paragraph, index) => {
                        console.log('paragraph',paragraph, index)
                        return paragraph ? (
                        <p
                            key={index}
                            className="absolute w-full left-0 text-left mb-0 leading-normal"
                            style={{
                                fontSize: `${fontSizes[index] || previewSize.width * 0.04}px`,
                                top: `${yPositions[index] || 0}px`,
                            }}
                        >
                            {paragraph}
                        </p>
                    ) : <></>
                    })}
                </div>
            </div>
        </div>
    );
};

export default TextPreview;