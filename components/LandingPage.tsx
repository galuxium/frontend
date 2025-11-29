import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  return (
    <div>
      <div className="flex items-center gap-4">
          
          <button
            onClick={() => router.push("/auth/signup")}
            className="px-5 py-2 bg-linear-to-r from-[#7b61ff] to-[#2e147e] text-white rounded-lg font-semibold shadow-lg hover:scale-95 duration-300"
          >
            Sign Up
          </button>

          <button
            onClick={() => router.push("/auth/login")}
            className="px-5 py-2 border-2 border-[#7b61ff] text-transparent bg-clip-text bg-linear-to-r from-[#7b61ff] to-[#2e147e] rounded-lg font-semibold hover:scale-95 duration-300 shadow-lg"
          >
            Log In
          </button>
        </div>
    </div>
  );
}
