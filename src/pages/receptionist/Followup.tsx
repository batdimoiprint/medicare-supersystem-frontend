import ReceptionistTable from '@/components/receptionist/ReceptionistTable'
import { useFollowups } from '@/hooks/use-followups'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { RefreshCw, Loader2, AlertCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export default function Followup() {
    const { data: followups, isLoading, isError, error, refetch, isFetching } = useFollowups()

    return (
        <div className="p-4">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h1 className="text-2xl font-semibold">Followups</h1>
                    <p className="text-sm text-muted-foreground">
                        Manage and view all patient follow-up appointments.
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetch()}
                    disabled={isFetching}
                >
                    {isFetching ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                        <RefreshCw className="w-4 h-4 mr-2" />
                    )}
                    Refresh
                </Button>
            </div>

            {isLoading ? (
                <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-64 w-full" />
                </div>
            ) : isError ? (
                <Card className="border-destructive">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2 text-destructive">
                            <AlertCircle className="w-5 h-5" />
                            <p>Error loading followups: {error?.message || 'Unknown error'}</p>
                        </div>
                        <Button variant="outline" className="mt-4" onClick={() => refetch()}>
                            Try Again
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <Card className="p-4">
                    <ReceptionistTable
                        items={followups}
                        basePath="/receptionist/followup"
                        type="followup"
                    />
                    {followups?.length === 0 && (
                        <p className="text-center text-muted-foreground py-8">
                            No follow-ups found.
                        </p>
                    )}
                </Card>
            )}
        </div>
    )
}
