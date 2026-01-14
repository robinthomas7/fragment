import './scss/index.scss'
import React, { useEffect, useRef, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { Canvas } from '@react-three/fiber'

import Experience from './Experience.jsx'

function App() {
    const container = useRef()

    return (
        <>
            <div className="container" ref={container}>
                <Canvas
                    style={{ position: 'fixed', top: 0, bottom: 0, left: 0, right: 0, overflow: 'hidden' }}
                    shadows
                    eventSource={container.current}
                    eventPrefix="client"
                    gl={{ powerPreference: 'high-performance', antialias: true }}
                    dpr={[1, 1]}
                    onCreated={({ gl }) => {
                        gl.setClearColor(0x000000, 1)
                    }}
                >
                    <Experience />
                </Canvas>
            </div >
        </>
    )
}


const root = ReactDOM.createRoot(document.querySelector('#root'))
root.render(<App />)
