import { useQueryCall, useUpdateCall } from "@ic-reactor/react";
import motokoLogo from "./assets/motoko_moving.png";
import motokoShadowLogo from "./assets/motoko_shadow.png";
import reactLogo from "./assets/react.svg";
import viteLogo from "./assets/vite.svg";

export default function Home() {
    const { data: count, refetch } = useQueryCall({
        functionName: "get",
    });

    const { call: increment, loading } = useUpdateCall({
        functionName: "inc",
        onSuccess: refetch,
    });

    return <div>Hello</div>;
}
