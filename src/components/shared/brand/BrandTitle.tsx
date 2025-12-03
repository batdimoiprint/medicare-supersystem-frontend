import Logo from '../Logo'
import { Label } from '@/components/ui/label'

export default function BrandTitle() {
    return (
        <div className='flex flex-row justify-center gap-4 py-4 cursor-pointer h-fill w-fill'>
            <Logo />
            <Label className='text-xl font-bold cursor-pointer text-foreground'>Medicare</Label>
        </div>
    )
}
