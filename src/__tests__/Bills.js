/**
 * @jest-environment jsdom
 */

import {screen, waitFor} from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES_PATH} from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store"
import router from "../app/Router.js";

jest.mock("../app/store", () => mockStore)

// Mock jQuery globally for all tests
global.$ = jest.fn(() => ({
  width: jest.fn(() => 800),
  find: jest.fn(() => ({
    html: jest.fn()
  })),
  modal: jest.fn(),
  click: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  off: jest.fn(),
  on: jest.fn(),
  css: jest.fn(),
  addClass: jest.fn(),
  removeClass: jest.fn(),
  classList: {
    contains: jest.fn(),
    add: jest.fn(),
    remove: jest.fn()
  }
}))

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      //to-do write expect expression
      expect(windowIcon.classList.contains('active-icon')).toBe(true)


    })
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
  })

  describe("When I interact with handleClickNewBill function", () => {
    test("Then it should navigate to NewBill page", () => {
      // Arrange
      const mockOnNavigate = jest.fn()
      const billsContainer = new (require("../containers/Bills.js")).default({
        document,
        onNavigate: mockOnNavigate,
        store: mockStore,
        localStorage: window.localStorage
      })

      // Act
      billsContainer.handleClickNewBill()

      // Assert
      expect(mockOnNavigate).toHaveBeenCalledWith(ROUTES_PATH['NewBill'])
    })
  })

  describe("When I interact with handleClickIconEye function", () => {
    test("Then it should display modal with bill image", () => {
      // Arrange
      const mockOnNavigate = jest.fn()
      const mockHtml = jest.fn()
      const mockModal = jest.fn()
      const mockFind = jest.fn(() => ({ html: mockHtml }))
      const mockWidth = jest.fn(() => 800)
      
      // Reset and setup jQuery mock
      global.$ = jest.fn(() => ({
        width: mockWidth,
        find: mockFind,
        modal: mockModal,
        click: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        off: jest.fn(),
        on: jest.fn(),
        css: jest.fn(),
        addClass: jest.fn(),
        removeClass: jest.fn(),
        classList: {
          contains: jest.fn(),
          add: jest.fn(),
          remove: jest.fn()
        }
      }))

      const billsContainer = new (require("../containers/Bills.js")).default({
        document,
        onNavigate: mockOnNavigate,
        store: mockStore,
        localStorage: window.localStorage
      })

      const mockIcon = {
        getAttribute: jest.fn(() => "http://example.com/bill.jpg")
      }

      // Act
      billsContainer.handleClickIconEye(mockIcon)

      // Assert
      expect(mockIcon.getAttribute).toHaveBeenCalledWith("data-bill-url")
      expect(global.$).toHaveBeenCalledWith('#modaleFile')
      expect(mockFind).toHaveBeenCalledWith(".modal-body")
      expect(mockHtml).toHaveBeenCalledWith(expect.stringContaining('bill-proof-container'))
      expect(mockModal).toHaveBeenCalledWith('show')
    })

    test("Then it should calculate correct image width", () => {
      // Arrange
      const mockOnNavigate = jest.fn()
      const mockHtml = jest.fn()
      const mockModal = jest.fn()
      const mockFind = jest.fn(() => ({ html: mockHtml }))
      const mockWidth = jest.fn(() => 1000) // Modal width of 1000px
      
      // Reset and setup jQuery mock
      global.$ = jest.fn(() => ({
        width: mockWidth,
        find: mockFind,
        modal: mockModal,
        click: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        off: jest.fn(),
        on: jest.fn(),
        css: jest.fn(),
        addClass: jest.fn(),
        removeClass: jest.fn(),
        classList: {
          contains: jest.fn(),
          add: jest.fn(),
          remove: jest.fn()
        }
      }))

      const billsContainer = new (require("../containers/Bills.js")).default({
        document,
        onNavigate: mockOnNavigate,
        store: mockStore,
        localStorage: window.localStorage
      })

      const mockIcon = {
        getAttribute: jest.fn(() => "http://example.com/bill.jpg")
      }

      // Act
      billsContainer.handleClickIconEye(mockIcon)

      // Assert
      // Image width should be 50% of modal width (1000 * 0.5 = 500)
      expect(mockHtml).toHaveBeenCalledWith(
        expect.stringContaining('width=500')
      )
    })
  })
})

describe("Given I am a user connected as Admin", () => {
  describe("When I am on Dashboard Page", () => {
    test("fetches bills from mock API GET", async () => {
      localStorage.setItem("user", JSON.stringify({ type: "Admin", email: "a@a" }));
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Dashboard)
     const contentTitle = await waitFor(() => screen.getByText("Validations"))
     expect(contentTitle).toBeTruthy()
      const contentPending  = await screen.getByText("En attente (1)")
      expect(contentPending).toBeTruthy()
      const contentRefused  = await screen.getByText("Refusé (2)")
      expect(contentRefused).toBeTruthy()
      expect(screen.getByTestId("big-billed-icon")).toBeTruthy()
    })
  })

  describe("When I call getBills method as Admin", () => {
    test("Then it should return formatted bills from store", async () => {
      // Arrange
      localStorage.setItem("user", JSON.stringify({ type: "Admin", email: "a@a" }));
      const billsContainer = new (await import("../containers/Bills.js")).default({
        document,
        onNavigate: jest.fn(),
        store: mockStore,
        localStorage: window.localStorage
      })

      // Act
      const result = await billsContainer.getBills()

      // Assert
      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
      expect(result).toHaveLength(4)
      
      // Vérifier que les dates sont formatées
      expect(result[0].date).toBe("4 Avr. 04")
      expect(result[1].date).toBe("1 Jan. 01")
      expect(result[2].date).toBe("3 Mar. 03")
      expect(result[3].date).toBe("2 Fév. 02")
      
      // Vérifier que les statuts sont formatés
      expect(result[0].status).toBe("En attente")
      expect(result[1].status).toBe("Refused")
      expect(result[2].status).toBe("Accepté")
      expect(result[3].status).toBe("Refused")
    })

    test("Then it should handle corrupted date data gracefully", async () => {
      // Arrange
      localStorage.setItem("user", JSON.stringify({ type: "Admin", email: "a@a" }));
      const corruptedStore = {
        bills() {
          return {
            list() {
              return Promise.resolve([{
                id: "corrupted-bill",
                date: "invalid-date",
                status: "pending",
                name: "Test Bill",
                amount: 100
              }])
            }
          }
        }
      }
      
      const billsContainer = new (await import("../containers/Bills.js")).default({
        document,
        onNavigate: jest.fn(),
        store: corruptedStore,
        localStorage: window.localStorage
      })

      // Spy on console.log to verify error logging
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      // Act
      const result = await billsContainer.getBills()

      // Assert
      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
      expect(result).toHaveLength(1)
      expect(result[0].date).toBe("invalid-date") // Date non formatée en cas d'erreur
      expect(result[0].status).toBe("En attente") // Status toujours formaté
      expect(consoleSpy).toHaveBeenCalled() // Vérifier que l'erreur est loggée
      
      // Cleanup
      consoleSpy.mockRestore()
    })

    test("Then it should return undefined when store is not available", async () => {
      // Arrange
      localStorage.setItem("user", JSON.stringify({ type: "Admin", email: "a@a" }));
      const billsContainer = new (await import("../containers/Bills.js")).default({
        document,
        onNavigate: jest.fn(),
        store: null,
        localStorage: window.localStorage
      })

      // Act
      const result = await billsContainer.getBills()

      // Assert
      expect(result).toBeUndefined()
    })

    test("Then it should handle store.bills().list() rejection", async () => {
      // Arrange
      localStorage.setItem("user", JSON.stringify({ type: "Admin", email: "a@a" }));
      const errorStore = {
        bills() {
          return {
            list() {
              return Promise.reject(new Error("Erreur de connexion"))
            }
          }
        }
      }
      
      const billsContainer = new (await import("../containers/Bills.js")).default({
        document,
        onNavigate: jest.fn(),
        store: errorStore,
        localStorage: window.localStorage
      })

      // Act & Assert
      await expect(billsContainer.getBills()).rejects.toThrow("Erreur de connexion")
    })
  })
})