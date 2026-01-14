import { Environment, OrbitControls } from "@react-three/drei"

import Camera from "./components/Camera"
import { Perf } from "r3f-perf"
import RockPaint from "./components/RockPaint"
import BackgroundGradient from "./components/BackgroundGradient"

export default function Experience() {

    return <>
        <Perf />
        <Environment preset="city" />
        <RockPaint/>
        <Camera />
        <BackgroundGradient />

    </>
}