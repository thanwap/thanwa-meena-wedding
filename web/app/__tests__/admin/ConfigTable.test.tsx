import { render, screen, fireEvent } from '@testing-library/react'
import ConfigTable from '../../admin/configs/components/ConfigTable'
import type { ConfigDto } from '../../admin/configs/types'

const mockConfigs: ConfigDto[] = [
  {
    id: 1,
    key: 'marry_date',
    value: '2026-12-26',
    type: 'date',
    createdAt: '2026-04-06T00:00:00Z',
    updatedAt: '2026-04-06T00:00:00Z',
  },
  {
    id: 2,
    key: 'venue_name',
    value: 'The Cop Seminar and Resort, Pattaya',
    type: 'location',
    createdAt: '2026-04-06T00:00:00Z',
    updatedAt: '2026-04-06T00:00:00Z',
  },
]

describe('ConfigTable', () => {
  it('renders all config rows', () => {
    render(
      <ConfigTable configs={mockConfigs} onEdit={jest.fn()} onDelete={jest.fn()} />,
    )
    expect(screen.getByText('marry_date')).toBeInTheDocument()
    expect(screen.getByText('2026-12-26')).toBeInTheDocument()
    expect(screen.getByText('venue_name')).toBeInTheDocument()
  })

  it('calls onEdit with the correct config when Edit is clicked', () => {
    const onEdit = jest.fn()
    render(
      <ConfigTable configs={mockConfigs} onEdit={onEdit} onDelete={jest.fn()} />,
    )
    fireEvent.click(screen.getAllByText('Edit')[0])
    expect(onEdit).toHaveBeenCalledWith(mockConfigs[0])
  })

  it('calls onDelete with the correct id when Delete is clicked', () => {
    const onDelete = jest.fn()
    render(
      <ConfigTable configs={mockConfigs} onEdit={jest.fn()} onDelete={onDelete} />,
    )
    fireEvent.click(screen.getAllByText('Delete')[0])
    expect(onDelete).toHaveBeenCalledWith(1)
  })

  it('shows empty message when configs list is empty', () => {
    render(<ConfigTable configs={[]} onEdit={jest.fn()} onDelete={jest.fn()} />)
    expect(screen.getByText('No configs yet.')).toBeInTheDocument()
  })
})
