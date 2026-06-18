import schoolLogo from '../../assets/1723987411228.jpg'

export default function Logo() {
  return (
    <div className='flex items-center gap-3'>
        <img className='h-11 w-11 rounded-lg object-cover' src = {schoolLogo} alt="Golden Castle International School logo" />
        
        <div className='font-logoFont leading-tight text-primary'>
            <p className='text-base font-extrabold sm:text-lg'>Golden Castle</p>
            <p className='text-xs font-bold uppercase tracking-wide text-primary/70 sm:text-sm'>International School</p>
        </div>
    </div>
  )
}
