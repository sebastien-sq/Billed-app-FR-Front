/**
 * @jest-environment jsdom
 */

import { screen, fireEvent, waitFor } from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import { ROUTES_PATH } from "../constants/routes.js"
import { localStorageMock } from "../__mocks__/localStorage.js"
import mockStore from "../__mocks__/store"

jest.mock("../app/store", () => mockStore)

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then the form should be displayed", () => {
      const html = NewBillUI()
      document.body.innerHTML = html
      expect(screen.getByTestId("form-new-bill")).toBeTruthy()
      expect(screen.getByTestId("file")).toBeTruthy()
    })
  })

  describe("When I interact with handleChangeFile function", () => {
    let newBill
    let mockOnNavigate

    beforeEach(() => {
      // Setup proper localStorage mock
      const mockLocalStorage = {
        getItem: jest.fn(() => JSON.stringify({
          type: 'Employee',
          email: 'employee@test.com'
        })),
        setItem: jest.fn(),
        clear: jest.fn(),
        removeItem: jest.fn()
      }
      Object.defineProperty(window, 'localStorage', { value: mockLocalStorage })

      const html = NewBillUI()
      document.body.innerHTML = html

      mockOnNavigate = jest.fn()
      newBill = new NewBill({
        document,
        onNavigate: mockOnNavigate,
        store: mockStore,
        localStorage: window.localStorage
      })
    })

    test("Then it should accept valid image files (JPG, JPEG, PNG)", async () => {
      const fileInput = screen.getByTestId("file")
      const validFile = new File(['image content'], 'test.jpg', { type: 'image/jpeg' })
      
      // Mock the file input
      Object.defineProperty(fileInput, 'files', {
        value: [validFile],
        writable: false
      })

      // Mock the event
      const mockEvent = {
        preventDefault: jest.fn(),
        target: {
          value: 'C:\\fakepath\\test.jpg'
        }
      }

      // Mock store response
      const mockResponse = {
        fileUrl: 'https://test.com/file.jpg',
        key: 'test-key-123'
      }
      jest.spyOn(mockStore.bills(), 'create').mockResolvedValue(mockResponse)

      // Act
      newBill.handleChangeFile(mockEvent)

      // Wait for async operations
      await waitFor(() => {
        expect(newBill.fileName).toBe('test.jpg')
        expect(newBill.fileUrl).toBe('https://test.com/file.jpg')
        expect(newBill.billId).toBe('test-key-123')
      })

      // Assert
      expect(mockEvent.preventDefault).toHaveBeenCalled()
    })

    test("Then it should accept PNG files", async () => {
      const fileInput = screen.getByTestId("file")
      const validFile = new File(['image content'], 'test.png', { type: 'image/png' })
      
      Object.defineProperty(fileInput, 'files', {
        value: [validFile],
        writable: false
      })

      const mockEvent = {
        preventDefault: jest.fn(),
        target: {
          value: 'C:\\fakepath\\test.png'
        }
      }

      // Mock store response
      const mockResponse = {
        fileUrl: 'https://test.com/file.png',
        key: 'test-key-456'
      }
      jest.spyOn(mockStore.bills(), 'create').mockResolvedValue(mockResponse)

      newBill.handleChangeFile(mockEvent)

      // Wait for async operations
      await waitFor(() => {
        expect(newBill.fileName).toBe('test.png')
        expect(newBill.fileUrl).toBe('https://test.com/file.png')
        expect(newBill.billId).toBe('test-key-456')
      })

      expect(mockEvent.preventDefault).toHaveBeenCalled()
    })

    test("Then it should reject invalid file formats and show alert", () => {
      const fileInput = screen.getByTestId("file")
      const invalidFile = new File(['document content'], 'test.pdf', { type: 'application/pdf' })
      
      Object.defineProperty(fileInput, 'files', {
        value: [invalidFile],
        writable: false
      })

      const mockEvent = {
        preventDefault: jest.fn(),
        target: {
          value: 'C:\\fakepath\\test.pdf'
        }
      }

      // Mock alert
      window.alert = jest.fn()

      // Act
      newBill.handleChangeFile(mockEvent)

      // Assert
      expect(mockEvent.preventDefault).toHaveBeenCalled()
      expect(window.alert).toHaveBeenCalledWith('Format non supporté. Formats acceptés: JPG, JPEG, PNG.')
      expect(mockEvent.target.value).toBe("")
      expect(newBill.fileUrl).toBe(null)
      expect(newBill.fileName).toBe(null)
      expect(newBill.billId).toBe(null)
    })

    test("Then it should reject when no file is selected", () => {
      const fileInput = screen.getByTestId("file")
      
      Object.defineProperty(fileInput, 'files', {
        value: [],
        writable: false
      })

      const mockEvent = {
        preventDefault: jest.fn(),
        target: {
          value: 'C:\\fakepath\\test.jpg'
        }
      }

      window.alert = jest.fn()

      newBill.handleChangeFile(mockEvent)

      expect(window.alert).toHaveBeenCalledWith('Format non supporté. Formats acceptés: JPG, JPEG, PNG.')
    })

    test("Then it should handle store.bills().create() success response", async () => {
      const fileInput = screen.getByTestId("file")
      const validFile = new File(['image content'], 'test.jpg', { type: 'image/jpeg' })
      
      Object.defineProperty(fileInput, 'files', {
        value: [validFile],
        writable: false
      })

      const mockEvent = {
        preventDefault: jest.fn(),
        target: {
          value: 'C:\\fakepath\\test.jpg'
        }
      }

      // Mock successful response
      const mockResponse = {
        fileUrl: 'https://test.com/file.jpg',
        key: 'test-key-123'
      }
      
      jest.spyOn(mockStore.bills(), 'create').mockResolvedValue(mockResponse)
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      newBill.handleChangeFile(mockEvent)

      await waitFor(() => {
        expect(newBill.billId).toBe('test-key-123')
        expect(newBill.fileUrl).toBe('https://test.com/file.jpg')
        expect(newBill.fileName).toBe('test.jpg')
      })

      consoleSpy.mockRestore()
    })

    test("Then it should handle store.bills().create() error", async () => {
      const fileInput = screen.getByTestId("file")
      const validFile = new File(['image content'], 'test.jpg', { type: 'image/jpeg' })
      
      Object.defineProperty(fileInput, 'files', {
        value: [validFile],
        writable: false
      })

      const mockEvent = {
        preventDefault: jest.fn(),
        target: {
          value: 'C:\\fakepath\\test.jpg'
        }
      }

      const mockError = new Error('Upload failed')
      jest.spyOn(mockStore.bills(), 'create').mockRejectedValue(mockError)
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

      newBill.handleChangeFile(mockEvent)

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(mockError)
      })

      consoleErrorSpy.mockRestore()
    })
  })

  describe("When I interact with handleSubmit function", () => {
    let newBill
    let mockOnNavigate

    beforeEach(() => {
      // Setup proper localStorage mock
      const mockLocalStorage = {
        getItem: jest.fn(() => JSON.stringify({
          type: 'Employee',
          email: 'employee@test.com'
        })),
        setItem: jest.fn(),
        clear: jest.fn(),
        removeItem: jest.fn()
      }
      Object.defineProperty(window, 'localStorage', { value: mockLocalStorage })

      const html = NewBillUI()
      document.body.innerHTML = html

      mockOnNavigate = jest.fn()
      newBill = new NewBill({
        document,
        onNavigate: mockOnNavigate,
        store: mockStore,
        localStorage: window.localStorage
      })

      // Set up form values
      screen.getByTestId("expense-type").value = "Transports"
      screen.getByTestId("expense-name").value = "Test expense"
      screen.getByTestId("amount").value = "100"
      screen.getByTestId("datepicker").value = "2023-12-01"
      screen.getByTestId("vat").value = "20"
      screen.getByTestId("pct").value = "20"
      screen.getByTestId("commentary").value = "Test commentary"
      
      // Set up file data
      newBill.fileUrl = "https://test.com/file.jpg"
      newBill.fileName = "test.jpg"
    })

    test("Then it should create a bill with correct data and navigate to Bills page", () => {
      const form = screen.getByTestId("form-new-bill")
      const mockEvent = {
        preventDefault: jest.fn(),
        target: form
      }

      const updateBillSpy = jest.spyOn(newBill, 'updateBill').mockImplementation()
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      newBill.handleSubmit(mockEvent)

      expect(mockEvent.preventDefault).toHaveBeenCalled()
      expect(updateBillSpy).toHaveBeenCalledWith({
        email: 'employee@test.com',
        type: 'Transports',
        name: 'Test expense',
        amount: 100,
        date: '2023-12-01',
        vat: '20',
        pct: 20,
        commentary: 'Test commentary',
        fileUrl: 'https://test.com/file.jpg',
        fileName: 'test.jpg',
        status: 'pending'
      })
      expect(mockOnNavigate).toHaveBeenCalledWith(ROUTES_PATH['Bills'])

      updateBillSpy.mockRestore()
      consoleSpy.mockRestore()
    })

    test("Then it should handle missing pct value with default 20", () => {
      screen.getByTestId("pct").value = ""
      
      const form = screen.getByTestId("form-new-bill")
      const mockEvent = {
        preventDefault: jest.fn(),
        target: form
      }

      const updateBillSpy = jest.spyOn(newBill, 'updateBill').mockImplementation()

      newBill.handleSubmit(mockEvent)

      expect(updateBillSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          pct: 20
        })
      )

      updateBillSpy.mockRestore()
    })

    test("Then it should handle NaN amount value", () => {
      screen.getByTestId("amount").value = "invalid"
      
      const form = screen.getByTestId("form-new-bill")
      const mockEvent = {
        preventDefault: jest.fn(),
        target: form
      }

      const updateBillSpy = jest.spyOn(newBill, 'updateBill').mockImplementation()

      newBill.handleSubmit(mockEvent)

      expect(updateBillSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: NaN
        })
      )

      updateBillSpy.mockRestore()
    })

    test("Then it should log the datepicker value", () => {
      const form = screen.getByTestId("form-new-bill")
      const mockEvent = {
        preventDefault: jest.fn(),
        target: form
      }

      const updateBillSpy = jest.spyOn(newBill, 'updateBill').mockImplementation()
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      newBill.handleSubmit(mockEvent)

      expect(consoleSpy).toHaveBeenCalledWith(
        'e.target.querySelector(`input[data-testid="datepicker"]`).value',
        '2023-12-01'
      )

      updateBillSpy.mockRestore()
      consoleSpy.mockRestore()
    })

    test("Then it should handle empty form values", () => {
      // Clear all form values
      screen.getByTestId("expense-type").value = ""
      screen.getByTestId("expense-name").value = ""
      screen.getByTestId("amount").value = ""
      screen.getByTestId("datepicker").value = ""
      screen.getByTestId("vat").value = ""
      screen.getByTestId("pct").value = ""
      screen.getByTestId("commentary").value = ""
      
      const form = screen.getByTestId("form-new-bill")
      const mockEvent = {
        preventDefault: jest.fn(),
        target: form
      }

      const updateBillSpy = jest.spyOn(newBill, 'updateBill').mockImplementation()

      newBill.handleSubmit(mockEvent)

      expect(updateBillSpy).toHaveBeenCalledWith({
        email: 'employee@test.com',
        type: '',
        name: '',
        amount: NaN,
        date: '',
        vat: '',
        pct: 20,
        commentary: '',
        fileUrl: 'https://test.com/file.jpg',
        fileName: 'test.jpg',
        status: 'pending'
      })

      updateBillSpy.mockRestore()
    })
  })
})
