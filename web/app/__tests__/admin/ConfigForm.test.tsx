import { render, screen, fireEvent } from '@testing-library/react'
import ConfigForm from '../../admin/configs/components/ConfigForm'
import type { ConfigDto } from '../../admin/configs/types'

describe('ConfigForm', () => {
  it('renders empty fields in add mode (no initial prop)', () => {
    render(<ConfigForm onSave={jest.fn()} onCancel={jest.fn()} />)
    expect(screen.getByLabelText('Key')).toHaveValue('')
    expect(screen.getByLabelText('Value')).toHaveValue('')
    expect(screen.getByLabelText('Type')).toHaveValue('')
  })

  it('pre-fills fields in edit mode (initial prop provided)', () => {
    const initial: ConfigDto = {
      id: 1,
      key: 'marry_date',
      value: '2026-12-26',
      type: 'date',
      createdAt: '',
      updatedAt: '',
    }
    render(<ConfigForm initial={initial} onSave={jest.fn()} onCancel={jest.fn()} />)
    expect(screen.getByLabelText('Key')).toHaveValue('marry_date')
    expect(screen.getByLabelText('Value')).toHaveValue('2026-12-26')
    expect(screen.getByLabelText('Type')).toHaveValue('date')
  })

  it('calls onSave with trimmed field values when form is submitted', () => {
    const onSave = jest.fn()
    render(<ConfigForm onSave={onSave} onCancel={jest.fn()} />)
    fireEvent.change(screen.getByLabelText('Key'), { target: { value: '  test_key  ' } })
    fireEvent.change(screen.getByLabelText('Value'), { target: { value: '  test_value  ' } })
    fireEvent.change(screen.getByLabelText('Type'), { target: { value: '  string  ' } })
    fireEvent.click(screen.getByText('Save'))
    expect(onSave).toHaveBeenCalledWith('test_key', 'test_value', 'string')
  })

  it('shows validation error and does not call onSave when fields are empty', () => {
    const onSave = jest.fn()
    render(<ConfigForm onSave={onSave} onCancel={jest.fn()} />)
    fireEvent.click(screen.getByText('Save'))
    expect(screen.getByText('All fields are required')).toBeInTheDocument()
    expect(onSave).not.toHaveBeenCalled()
  })

  it('calls onCancel when Cancel is clicked', () => {
    const onCancel = jest.fn()
    render(<ConfigForm onSave={jest.fn()} onCancel={onCancel} />)
    fireEvent.click(screen.getByText('Cancel'))
    expect(onCancel).toHaveBeenCalled()
  })
})
