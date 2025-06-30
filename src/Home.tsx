import { useQueryCall, useUpdateCall } from "@ic-reactor/react";
import motokoLogo from "./assets/motoko_moving.png";
import motokoShadowLogo from "./assets/motoko_shadow.png";
import reactLogo from "./assets/react.svg";
import viteLogo from "./assets/vite.svg";
import { Button } from "./components/ui/button";

export default function Home() {
    const { data: count, refetch } = useQueryCall({
        functionName: "get",
    });

    const { call: increment, loading } = useUpdateCall({
        functionName: "inc",
        onSuccess: refetch,
    });

    return (
        <div className="w-screen h-screen bg-slate-600 flex flex-col items-center justify-center gap-10">
            <div className="flex items-center justify-center gap-20">
                <img className="w-20" src={motokoLogo} alt="" />
                <img className="w-20" src={reactLogo} alt="" />
                <img className="w-20" src={viteLogo} alt="" />
            </div>
            <Button onClick={increment} disabled={loading}>
                count is {count?.toString() ?? "loading..."}
            </Button>
            <p className="text-white">
                Edit <code>backend/Backend.mo</code> and save to test HMR
            </p>
        </div>
    );
}
