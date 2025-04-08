"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"

interface AnalyticsProps {
  dailyStats: {
    totalGuests: number
    activeGuests: number
    checkedOutGuests: number
    totalComplaints: number
    totalSleepovers: number
    totalMaintenance: number
  }
}

export function Analytics({ dailyStats }: AnalyticsProps) {
  const data = [
    {
      name: "Guests",
      total: dailyStats.totalGuests,
      active: dailyStats.activeGuests,
      checkedOut: dailyStats.checkedOutGuests
    },
    {
      name: "Complaints",
      total: dailyStats.totalComplaints
    },
    {
      name: "Sleepovers",
      total: dailyStats.totalSleepovers
    },
    {
      name: "Maintenance",
      total: dailyStats.totalMaintenance
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Statistics</CardTitle>
      </CardHeader>
      <CardContent className="pl-2">
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis
                dataKey="name"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}`}
              />
              <Tooltip />
              <Bar
                dataKey="total"
                fill="currentColor"
                radius={[4, 4, 0, 0]}
                className="fill-primary"
              />
              <Bar
                dataKey="active"
                fill="currentColor"
                radius={[4, 4, 0, 0]}
                className="fill-green-500"
              />
              <Bar
                dataKey="checkedOut"
                fill="currentColor"
                radius={[4, 4, 0, 0]}
                className="fill-yellow-500"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
} 