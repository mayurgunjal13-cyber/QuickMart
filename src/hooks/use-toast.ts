import { useState, useEffect } from "react"

const TOAST_LIMIT = 3

type ToastProps = {
    id: string
    title?: string
    description?: string
    action?: React.ReactNode
    [key: string]: any
}

let count = 0

function genId() {
    count = (count + 1) % Number.MAX_VALUE
    return count.toString()
}

type ActionType = {
    type: "ADD_TOAST" | "UPDATE_TOAST" | "DISMISS_TOAST" | "REMOVE_TOAST"
    toast?: Partial<ToastProps>
    toastId?: string
}

let listeners: Array<(state: any) => void> = []
let memoryState: { toasts: ToastProps[] } = { toasts: [] }

function dispatch(action: ActionType) {
    memoryState = { ...memoryState }

    switch (action.type) {
        case "ADD_TOAST":
            memoryState.toasts = [
                { ...action.toast, id: genId() } as ToastProps,
                ...memoryState.toasts,
            ].slice(0, TOAST_LIMIT)
            break
        case "DISMISS_TOAST":
            // simplified
            memoryState.toasts = memoryState.toasts.filter((t) => t.id !== action.toastId)
            break
        case "REMOVE_TOAST":
            memoryState.toasts = memoryState.toasts.filter((t) => t.id !== action.toastId)
            break
    }

    listeners.forEach((listener) => {
        listener(memoryState)
    })
}

function toast({ ...props }: Omit<ToastProps, "id">) {
    dispatch({
        type: "ADD_TOAST",
        toast: props,
    })
}

function useToast() {
    const [state, setState] = useState(memoryState)

    useEffect(() => {
        listeners.push(setState)
        return () => {
            const index = listeners.indexOf(setState)
            if (index > -1) {
                listeners.splice(index, 1)
            }
        }
    }, [state])

    return {
        ...state,
        toast,
        dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
    }
}

export { useToast, toast }
