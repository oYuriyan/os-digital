import { Link, useLocation } from "react-router-dom"
import { LayoutDashboard, FileText, Building2, Users, MessageSquare } from "lucide-react"
import { motion } from "framer-motion"

export function MobileBottomNav() {
  const location = useLocation()

  const tabs = [
    { title: "Painel",   icon: LayoutDashboard, route: "/dashboard" },
    { title: "OS",       icon: FileText,         route: "/os"       },
    { title: "Tickets",  icon: MessageSquare,    route: "/tickets"  },
    { title: "Clientes", icon: Building2,        route: "/clientes" },
    { title: "Equipe",   icon: Users,            route: "/equipe"   },
  ]

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-nav px-6 pb-safe pt-2">
      <div className="flex justify-between items-center h-16">
        {tabs.map((tab) => {
          const isActive = tab.route === "/os"
            ? location.pathname.startsWith("/os")
            : location.pathname === tab.route

          return (
            <Link
              key={tab.route}
              to={tab.route}
              className="relative flex flex-col items-center justify-center w-full h-full space-y-1"
            >
              {isActive && (
                <motion.div
                  layoutId="bubble"
                  className="absolute inset-0 bg-slate-200/40 rounded-2xl -z-10 w-16 mx-auto h-12 top-2"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <tab.icon
                className={`h-6 w-6 transition-colors duration-300 ${
                  isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              />
              <span
                className={`text-[10px] font-medium transition-colors duration-300 ${
                  isActive ? "text-blue-600 dark:text-blue-400 font-bold" : "text-slate-500"
                }`}
              >
                {tab.title}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
