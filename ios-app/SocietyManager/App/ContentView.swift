import SwiftUI

struct ContentView: View {
    @EnvironmentObject var authViewModel: AuthViewModel

    var body: some View {
        Group {
            if authViewModel.isCheckingAuth {
                LaunchScreenView()
            } else if authViewModel.isAuthenticated {
                MainTabView()
                    .environmentObject(authViewModel)
            } else {
                LoginView()
                    .environmentObject(authViewModel)
            }
        }
        .animation(.easeInOut(duration: 0.3), value: authViewModel.isAuthenticated)
        .task {
            await authViewModel.checkExistingAuth()
        }
    }
}

struct LaunchScreenView: View {
    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "building.2.fill")
                .font(.system(size: 64))
                .foregroundStyle(.blue)
            Text("Society Manager")
                .font(.title.bold())
            ProgressView()
        }
    }
}

#Preview {
    ContentView()
        .environmentObject(AuthViewModel())
}
