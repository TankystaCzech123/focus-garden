import ExpoModulesCore
import FamilyControls
import ManagedSettings
import SwiftUI

private let selectionKey = "focus.selection"

private func loadSelection() -> FamilyActivitySelection {
  guard let data = UserDefaults.standard.data(forKey: selectionKey),
        let sel = try? JSONDecoder().decode(FamilyActivitySelection.self, from: data)
  else { return FamilyActivitySelection() }
  return sel
}

private struct PickerView: View {
  @State var selection: FamilyActivitySelection
  let onDone: (FamilyActivitySelection) -> Void

  var body: some View {
    NavigationView {
      FamilyActivityPicker(selection: $selection)
        .navigationBarItems(trailing: Button("Hotovo") { onDone(selection) })
    }
  }
}

public class FocusNativeModule: Module {
  private let store = ManagedSettingsStore()

  public func definition() -> ModuleDefinition {
    Name("FocusNative")

    AsyncFunction("getInstalledApps") { () -> [[String: String]] in [] }

    Function("needsPicker") { true }

    // Opens the system picker; resolves with the number of chosen apps.
    AsyncFunction("pickApps") { (promise: Promise) in
      Task { @MainActor in
        do {
          try await AuthorizationCenter.shared.requestAuthorization(for: .individual)
        } catch {
          promise.reject("E_AUTH", "Screen Time access denied: \(error.localizedDescription)")
          return
        }
        guard let root = UIApplication.shared.connectedScenes
          .compactMap({ ($0 as? UIWindowScene)?.keyWindow?.rootViewController }).first
        else { promise.reject("E_UI", "No view controller"); return }

        var host: UIViewController?
        host = UIHostingController(rootView: PickerView(selection: loadSelection()) { sel in
          if let data = try? JSONEncoder().encode(sel) {
            UserDefaults.standard.set(data, forKey: selectionKey)
          }
          host?.dismiss(animated: true)
          promise.resolve(sel.applicationTokens.count + sel.categoryTokens.count)
        })
        root.present(host!, animated: true)
      }
    }

    // iOS has no kiosk mode: shield every app except the chosen ones.
    AsyncFunction("start") { (_: [String], _: Bool) -> [String: Bool] in
      let sel = loadSelection()
      self.store.shield.applicationCategories = .all(except: sel.applicationTokens)
      self.store.shield.webDomainCategories = .all()
      return ["fullKiosk": false, "needsAccessibility": false]
    }

    AsyncFunction("stop") { self.store.clearAllSettings() }

    Function("isActive") { () -> Bool in self.store.shield.applicationCategories != nil }
    Function("dndGranted") { () -> Bool in true }
    AsyncFunction("openDndSettings") { }

    Function("getDeviceInfo") { () -> [String: String] in
      ["model": "iOS", "android": ""]
    }

    Function("getVersion") { () -> String in
      Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "0.0.0"
    }
    // iOS apps cannot install updates themselves (App Store / TestFlight only).
    AsyncFunction("downloadAndInstall") { (_: String) -> String in "unsupported" }

    AsyncFunction("getDevLog") { () -> String in "" }
    AsyncFunction("clearDevLog") { }

    // On iOS the user opens apps from the home screen.
    AsyncFunction("launchApp") { (_: String) in }
  }
}
