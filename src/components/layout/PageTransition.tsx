import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

// Animation variants mimicking iOS navigation
const variants = {
    initial: (direction: number) => ({
        x: direction > 0 ? '100%' : '-100%',
        opacity: 0,
        scale: 0.95
    }),
    animate: {
        x: 0,
        opacity: 1,
        scale: 1,
        transition: {
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 }
        }
    },
    exit: (direction: number) => ({
        x: direction < 0 ? '100%' : '-100%',
        opacity: 0,
        scale: 0.95,
        transition: {
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 }
        }
    })
};

// Overlay variants for modals (Slide up)
export const slideUpVariants = {
    hidden: { y: "100%", opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: { type: "spring", stiffness: 300, damping: 30 }
    },
    exit: {
        y: "100%",
        opacity: 0,
        transition: { duration: 0.2 }
    }
};

interface PageTransitionProps {
    children: ReactNode;
    direction?: number; // 1 for forward (push), -1 for backward (pop)
    className?: string;
}

export function PageTransition({ children, direction = 0, className = "" }: PageTransitionProps) {
    return (
        <motion.div
            custom={direction}
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            className={`w-full h-full absolute inset-0 bg-bg-main overflow-y-auto overflow-x-hidden ${className}`}
        >
            {children}
        </motion.div>
    );
}
