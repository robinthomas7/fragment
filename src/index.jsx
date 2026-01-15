import './scss/index.scss'
import { useEffect, useRef } from 'react'
import ReactDOM from 'react-dom/client'
import { Canvas } from '@react-three/fiber'

import Experience from './Experience.jsx'
import { RockAsset, addStyleDomElement } from './RockAsset.jsx'


function App() {

    useEffect(() => {
        addStyleDomElement()
    }, [])

    return (
        <>
                <Canvas
                    style={{ position: 'fixed', top: 0, bottom: 0, left: 0, right: 0, overflow: 'hidden' }}
                    shadows
                    eventPrefix="client"
                    gl={{ powerPreference: 'high-performance', antialias: true }}
                    dpr={[1, 1]}
                    eventSource={RockAsset.domElement ? document.querySelector(RockAsset.domElement) : undefined}
                    onCreated={({ gl }) => {
                        gl.setClearColor(0x000000, 1),
                            gl.domElement.style.touchAction = "none"
                    }}
                >
                    <Experience />
                </Canvas>
        </>
    )
}


const root = ReactDOM.createRoot(document.querySelector('#root'))
root.render(<App />)
