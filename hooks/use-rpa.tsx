"use client"

import { useState, useEffect, useCallback } from "react"
import { monitoring } from "@/lib/monitoring"

interface RPAConfig {
  enabled: boolean
  autoOptimize: boolean
  batchSize: number
  interval: number
  maxRetries: number
}

interface RPATask {
  id: string
  type: string
  status: "pending" | "running" | "completed" | "failed"
  data: any
  createdAt: Date
  completedAt?: Date
  error?: string
}

interface RPAMetrics {
  totalTasks: number
  completedTasks: number
  failedTasks: number
  averageExecutionTime: number
  successRate: number
}

export function useRPA() {
  const [config, setConfig] = useState<RPAConfig>({
    enabled: false,
    autoOptimize: true,
    batchSize: 10,
    interval: 5000,
    maxRetries: 3,
  })

  const [tasks, setTasks] = useState<RPATask[]>([])
  const [metrics, setMetrics] = useState<RPAMetrics>({
    totalTasks: 0,
    completedTasks: 0,
    failedTasks: 0,
    averageExecutionTime: 0,
    successRate: 0,
  })

  const [isRunning, setIsRunning] = useState(false)

  // Add task to queue
  const addTask = useCallback((type: string, data: any): string => {
    const task: RPATask = {
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      status: "pending",
      data,
      createdAt: new Date(),
    }

    setTasks((prev) => [...prev, task])

    monitoring.trackUserAction("rpa_task_added", "automation", {
      taskType: type,
      taskId: task.id,
    })

    return task.id
  }, [])

  // Execute task
  const executeTask = useCallback(async (task: RPATask): Promise<void> => {
    try {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: "running" } : t)))

      // Simulate task execution
      await new Promise((resolve) => setTimeout(resolve, Math.random() * 2000 + 1000))

      // Simulate success/failure
      const success = Math.random() > 0.1 // 90% success rate

      if (success) {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === task.id
              ? {
                  ...t,
                  status: "completed",
                  completedAt: new Date(),
                }
              : t,
          ),
        )

        monitoring.trackUserAction("rpa_task_completed", "automation", {
          taskType: task.type,
          taskId: task.id,
          executionTime: Date.now() - task.createdAt.getTime(),
        })
      } else {
        throw new Error("Task execution failed")
      }
    } catch (error) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id
            ? {
                ...t,
                status: "failed",
                error: error instanceof Error ? error.message : "Unknown error",
                completedAt: new Date(),
              }
            : t,
        ),
      )

      monitoring.trackError({
        message: `RPA task failed: ${task.type}`,
        severity: "medium",
        context: {
          taskId: task.id,
          taskType: task.type,
          error: error instanceof Error ? error.message : "Unknown error",
        },
      })
    }
  }, [])

  // Process task queue
  const processQueue = useCallback(async () => {
    if (!config.enabled || isRunning) return

    const pendingTasks = tasks.filter((t) => t.status === "pending")
    if (pendingTasks.length === 0) return

    setIsRunning(true)

    try {
      const batch = pendingTasks.slice(0, config.batchSize)
      await Promise.all(batch.map(executeTask))
    } catch (error) {
      console.error("Error processing RPA queue:", error)
    } finally {
      setIsRunning(false)
    }
  }, [config, tasks, isRunning, executeTask])

  // Update metrics
  useEffect(() => {
    const completedTasks = tasks.filter((t) => t.status === "completed")
    const failedTasks = tasks.filter((t) => t.status === "failed")
    const totalTasks = tasks.length

    const executionTimes = completedTasks
      .filter((t) => t.completedAt)
      .map((t) => t.completedAt!.getTime() - t.createdAt.getTime())

    const averageExecutionTime =
      executionTimes.length > 0 ? executionTimes.reduce((sum, time) => sum + time, 0) / executionTimes.length : 0

    const successRate = totalTasks > 0 ? (completedTasks.length / totalTasks) * 100 : 0

    setMetrics({
      totalTasks,
      completedTasks: completedTasks.length,
      failedTasks: failedTasks.length,
      averageExecutionTime,
      successRate,
    })
  }, [tasks])

  // Auto-process queue
  useEffect(() => {
    if (!config.enabled) return

    const interval = setInterval(processQueue, config.interval)
    return () => clearInterval(interval)
  }, [config.enabled, config.interval, processQueue])

  // Toggle RPA
  const toggleRPA = useCallback((enabled: boolean) => {
    setConfig((prev) => ({ ...prev, enabled }))

    monitoring.trackUserAction("rpa_toggled", "automation", {
      enabled,
      timestamp: new Date().toISOString(),
    })
  }, [])

  // Update configuration
  const updateConfig = useCallback((updates: Partial<RPAConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }))

    monitoring.trackUserAction("rpa_config_updated", "automation", {
      updates,
      timestamp: new Date().toISOString(),
    })
  }, [])

  // Clear completed tasks
  const clearCompleted = useCallback(() => {
    setTasks((prev) => prev.filter((t) => t.status !== "completed"))

    monitoring.trackUserAction("rpa_tasks_cleared", "automation", {
      timestamp: new Date().toISOString(),
    })
  }, [])

  // Retry failed tasks
  const retryFailed = useCallback(() => {
    setTasks((prev) => prev.map((t) => (t.status === "failed" ? { ...t, status: "pending", error: undefined } : t)))

    monitoring.trackUserAction("rpa_tasks_retried", "automation", {
      timestamp: new Date().toISOString(),
    })
  }, [])

  return {
    config,
    tasks,
    metrics,
    isRunning,
    addTask,
    toggleRPA,
    updateConfig,
    clearCompleted,
    retryFailed,
    processQueue,
  }
}

// Export alias for compatibility
export const useRPAAutomation = useRPA

export default useRPA
