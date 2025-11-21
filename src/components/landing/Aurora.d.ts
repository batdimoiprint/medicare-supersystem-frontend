declare module '@/components/landing/Aurora' {
    import type React from 'react'

    export interface AuroraProps {
        colorStops?: string[]
        blend?: number
        amplitude?: number
        speed?: number
        className?: string
        style?: React.CSSProperties
    }

    const Aurora: React.ComponentType<AuroraProps>
    export default Aurora
}
