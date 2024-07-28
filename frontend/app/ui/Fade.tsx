import { useRef } from 'react';
import { Transition } from 'react-transition-group';

export default function Fade({ duration, inProp, children, onExited }: { duration: number, inProp: boolean, onExited?: () => void, children: React.ReactNode }) {
    const defaultStyle = {
        transition: `opacity ${duration}ms ease-in-out`,
        opacity: 0,
    }
    const transitionStyles = {
        entering: { opacity: 1 },
        entered: { opacity: 1 },
        exiting: { opacity: 0 },
        exited: { opacity: 0 },
        unmounted: { opacity: 0 },
    };
    const nodeRef = useRef(null)

    return (
        <Transition appear={true} nodeRef={nodeRef} in={inProp} timeout={duration} onExited={onExited}>
            {state => (
                <div ref={nodeRef} style={{
                    ...defaultStyle,
                    ...transitionStyles[state]
                }}>
                    {children}
                </div>
            )}
        </Transition>
    )
}