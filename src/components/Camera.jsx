import { PerspectiveCamera } from "@react-three/drei"

export default function Camera() {

    return (
        <PerspectiveCamera
            position={[0, 0, 13]}
            near={0.1}
            makeDefault
        />
    )

}