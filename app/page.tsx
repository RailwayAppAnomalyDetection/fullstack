"use client"
// import Hello from "./components/hello";
import {useRouter} from "next/navigation"

export default function Home() {
  const router = useRouter();
  const handleStart = () => {
    router.push("/home");
  }
  return (
    <>
      <div className="flex h-screen items-center justify-center bg-array-100">
        <div className="bg-blue-900 text-white p-8 rounded-lg shadow-lg text-center">
          <h1 className="text-2xl font-bold mb-6">Railway Comfort Indicator</h1>
          <button onClick={handleStart} className="bg-gray-300 text-blue-900 font-semibold px-6 py-2 rounded-md hover:bg-gray-400">
            START
          </button>
        </div>
      </div>
      {/* <Hello /> */}
    </>
  );
}
