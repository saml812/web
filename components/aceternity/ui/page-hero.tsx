"use client"
import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";

export const ImagesSlider = React.memo(({
    images,
    children,
    overlay = true,
    overlayClassName,
    className,
    autoplay = true,
    direction = "down",
    interval = 5000,
}: {
    images: string[];
    children: React.ReactNode;
    overlay?: boolean;
    overlayClassName?: string;
    className?: string;
    autoplay?: boolean;
    direction?: "up" | "down";
    interval?: number;
}) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loadedImages, setLoadedImages] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        const preloadImages = async () => {
            try {
                const loadPromises = images.map(src => {
                    return new Promise((resolve, reject) => {
                        const img = new Image();
                        img.src = src;
                        img.onload = () => resolve(src);
                        img.onerror = reject;
                    });
                });

                const loaded = await Promise.all(loadPromises);
                if (mounted) {
                    setLoadedImages(loaded as string[]);
                    setIsLoading(false);
                }
            } catch (error) {
                console.error("Failed to load images:", error);
                if (mounted) {
                    setIsLoading(false);
                }
            }
        };

        preloadImages();

        return () => {
            mounted = false;
        };
    }, [images]);

    const slideVariants = {
        initial: {
            scale: 1,
            opacity: 0,
            rotateX: 0,
        },
        visible: {
            scale: 1,
            rotateX: 0,
            opacity: 1,
            transition: {
                duration: 0.8,
                ease: [0.4, 0.0, 0.2, 1],
            },
        },
        exit: {
            opacity: 0,
            y: direction === "up" ? "-100%" : "100%",
            transition: { duration: 0.8 },
        },
    };

    const handleImageNavigation = useCallback((direction: 'next' | 'prev') => {
        requestAnimationFrame(() => {
            setCurrentIndex(prevIndex => {
                if (direction === 'next') {
                    return prevIndex + 1 === images.length ? 0 : prevIndex + 1;
                }
                return prevIndex - 1 < 0 ? images.length - 1 : prevIndex - 1;
            });
        });
    }, [images.length]);

    useEffect(() => {
        let autoplayInterval: NodeJS.Timeout | undefined;
        
        if (autoplay && !isLoading) {
            autoplayInterval = setInterval(() => {
                handleImageNavigation('next');
            }, interval);
        }

        return () => {
            if (autoplayInterval) {
                clearInterval(autoplayInterval);
            }
        };
    }, [autoplay, handleImageNavigation, interval, isLoading]);

    if (isLoading) {
        return (
            <div className="h-full w-full flex items-center justify-center bg-black/20 backdrop-blur-sm">
                <div className="animate-pulse text-xl text-neutral-400">Loading images...</div>
            </div>
        );
    }

    return (
        <div
            className={cn("h-screen w-full flex items-center justify-center relative overflow-hidden", className)}
            style={{ perspective: "1000px" }}
        >
            {children}
            {overlay && (
                <div className={cn("absolute inset-0 bg-black/60 z-40", overlayClassName)} />
            )}

            <AnimatePresence mode="wait">
                <motion.img
                    key={currentIndex}
                    src={loadedImages[currentIndex]}
                    initial="initial"
                    animate="visible"
                    exit="exit"
                    variants={slideVariants}
                    className="absolute inset-0 h-screen w-full object-cover object-center"
                    alt={`Slide ${currentIndex + 1}`}
                    loading="lazy"
                    style={{
                        willChange: 'transform',
                        backfaceVisibility: 'hidden',
                    }}
                />
            </AnimatePresence>
        </div>
    );
});

ImagesSlider.displayName = "ImagesSlider";