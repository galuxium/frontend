"use client";

import { useSession } from "@/lib/SessionContext";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import {
 FaProjectDiagram, FaCloudUploadAlt, FaGithub,
  FaChartLine, FaRobot, FaRupeeSign,  FaChartPie,
  FaUsers, FaComments, FaClock
} from "react-icons/fa";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from "recharts";

interface Project {
  name: string;
  status: "Live" | "Testing" | "Draft";
  created: string;
  modified: string;
}
interface TrendPoint {
  day: string;
  msgs: number;
  mvps: number;
}

export default function PremiumDashboard() {
  const {session} = useSession();
  const router = useRouter();

  const [metrics, setMetrics] = useState({
    totalMvps: 0, activeDeployments: 0,
    githubPushed: 0, totalTokens: 0,
    revenue: 0, mrr: 0, arr: 0, aiCost: 0, retention: 0,
    conversations: 0, avgTokensPerMsg: 0, avgBuildTime: 0
  });

  const [projects, setProjects] = useState<Project[]>([]);
  const [trendData, setTrendData] = useState<TrendPoint[]>([]);

  const planPrice = 29;
  const tokenPrice = 0.000002;

  useEffect(() => {
    const fetchData = async () => {
      if (!session?.user) return router.push("/");
      console.log("Session",session)
      const userId = session.user.id;

      // Fetch user row
      const { data: userRow } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (!userRow) return router.push("/");

      // Fetch mvps, conversations, messages
      const [{ data: mvps }, { data: conversations }, { data: messages }] = await Promise.all([
        supabase.from("mvps").select("*").eq("user_id", userId),
        supabase.from("conversations").select("*").eq("user_id", userId),
        supabase.from("messages").select("role, conversation_id, created_at")
          .in(
            "conversation_id",
            (await supabase.from("conversations").select("id").eq("user_id", userId)).data?.map(c => c.id) || []
          ),
      ]);

      const totalMvps = mvps?.length ?? 0;
      const activeDeployments = mvps?.filter(m => m.vercel_deployed || m.netlify_url).length ?? 0;
      const githubPushed = mvps?.filter(m => m.github_pushed).length ?? 0;

      const totalMessages = messages?.length ?? 0;
      const totalTokens = totalMessages * 200; // est.

      // Revenue & retention
      const revenue = totalMvps * planPrice;
      const mrr = revenue;
      const arr = mrr * 12;
      const aiCost = totalTokens * tokenPrice;

      const days = Math.floor(
        (new Date().getTime() - new Date(userRow.created_at).getTime()) / (1000 * 60 * 60 * 24)
      );
      const retention = days > 30 ? 100 : 100 - (30 - days);

      // Avg build time (fake derivation from created_at vs modified_at if available)
      const avgBuildTime = mvps && mvps.length > 0
        ? mvps.reduce((sum, m) => sum + (new Date(m.created_at).getTime() - new Date(userRow.created_at).getTime()), 0) / mvps.length / 1000 / 3660
        : 0;

      // Avg tokens per message
      const avgTokensPerMsg = totalMessages > 0 ? (totalTokens / totalMessages) : 0;

      // Fake trend data (messages per day last 7 days)
      const trend = Array.from({ length: 7 }).map((_, i) => ({
        day: `Day ${i + 1}`,
        msgs: Math.floor(Math.random() * 30) + 5,
        mvps: Math.floor(Math.random() * 3),
      }));

      setMetrics({
        totalMvps, activeDeployments, githubPushed, totalTokens,
        revenue, mrr, arr, aiCost, retention,
        conversations: conversations?.length ?? 0,
        avgTokensPerMsg, avgBuildTime
      });

      setProjects(
        mvps?.map(p => ({
          name: p.name,
          status: p.vercel_deployed || p.netlify_url ? "Live" : p.github_pushed ? "Testing" : "Draft",
          created: new Date(p.created_at).toLocaleDateString(),
          modified: new Date(p.created_at).toLocaleDateString()
        })) || []
      );

      setTrendData(trend);
    };

    fetchData();
  }, [session, router]);

  return (
    <div className="min-h-screen bg-gradient-to-r from-[#2000c1]/10 to-[#2e147e]/10 text-[#1A1A1A] p-10">
      {/* Header */}
      <div>
        <h1 className="text-5xl py-3 font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-[#2000c1] to-[#2e147e]">
          Welcome back, {session?.user?.user_metadata.first_name || session?.user?.user_metadata?.name}!
        </h1>
        <p className="text-lg font-semibold text-[#6B7280] mt-4">
          Command, Create, Conquer — From Your AI Cockpit.
        </p>
      </div>

      {/* Create button
      <Link href="/create">
        <div className="flex flex-row gap-3 mt-10 w-[16vw] h-[7vh] items-center justify-center bg-gradient-to-r from-[#2000c1] to-[#2e147e] brightness-125 rounded-lg shadow-xl text-white">
          <FaRocket className="text-lg" />
          <h3 className="text-lg font-bold">Create New MVP</h3>
        </div>
      </Link> */}

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mt-8">
        <MetricCard icon={<FaProjectDiagram size={40} className="text-orange-600" />} label="Total MVPs" value={metrics.totalMvps} />
        <MetricCard icon={<FaCloudUploadAlt size={40} className="text-blue-700" />} label="Deployments" value={metrics.activeDeployments} />
        <MetricCard icon={<FaGithub size={40} className="text-black" />} label="GitHub Pushed" value={metrics.githubPushed} />
        <MetricCard icon={<FaRupeeSign size={40} className="text-yellow-600" />} label="Revenue" value={`${metrics.revenue}`} />
        <MetricCard icon={<FaChartPie size={40} className="text-emerald-600" />} label="MRR" value={`₹${metrics.mrr}`} />
        {/* <MetricCard icon={<FaChartBar size={40} className="text-green-600" />} label="ARR" value={`₹${metrics.arr}`} /> */}
        
        <MetricCard icon={<FaChartLine size={40} className="text-purple-700" />} label="Retention" value={`${metrics.retention.toFixed(1)}%`} />
        <MetricCard icon={<FaUsers size={40} className="text-pink-600" />} label="Conversations" value={metrics.conversations} />
        <MetricCard icon={<FaRobot size={40} className="text-red-600" />} label="AI Cost" value={`₹${metrics.aiCost.toFixed(2)}`} />
        <MetricCard icon={<FaComments size={40} className="text-indigo-600" />} label="Avg Tokens/Msg" value={metrics.avgTokensPerMsg.toFixed(1)} />
        <MetricCard icon={<FaClock size={40} className="text-gray-600" />} label="Avg Build Time" value={`${metrics.avgBuildTime.toFixed(1)} s`} />
      </div>

      {/* Trends */}
      <section className="mt-12 rounded-2xl shadow-xl border border-gray-200 bg-white p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Usage Trends</h2>
        <div className="grid md:grid-cols-2 gap-10">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="msgs" stroke="#2000c1" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="mvps" fill="#2e147e" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Recent Projects */}
      <section className="mt-12 rounded-2xl shadow-xl border border-gray-200 bg-white p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Recent Projects</h2>
        <TableProjects projects={projects} />
      </section>
    </div>
  );
}

const MetricCard = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: number | string }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.2 }}
    className="p-8 rounded-3xl bg-white shadow-xl border border-[#E5E7EB] flex items-center gap-6"
  >
    {icon}
    <div>
      <h2 className="text-3xl font-extrabold">{value}</h2>
      <p className="text-[#4B5563] mt-2">{label}</p>
    </div>
  </motion.div>
);

const TableProjects = ({ projects }: { projects: Project[] }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm text-left text-gray-700">
      <thead className=" border-b border-gray-200">
        <tr>
          <th className="py-3">Project</th>
          <th className="pl-20">Status</th>
          <th>Created</th>
        </tr>
      </thead>
      <tbody>
        {projects.map((p, i) => (
          <tr key={i} className="border-b border-gray-100 hover:bg-gray-50 transition">
            <td className="py-4 w-[50vw] text-gray-500 font-bold">{p.name}</td>
            <td className="pl-20">
              <span
                className={`px-3 py-1 rounded-full text-sm font-bold
                ${p.status === "Live"
                    ? "bg-green-100 text-green-700"
                    : p.status === "Testing"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
              >
                {p.status}
              </span>
            </td>
            <td className="font-bold">{p.created}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
