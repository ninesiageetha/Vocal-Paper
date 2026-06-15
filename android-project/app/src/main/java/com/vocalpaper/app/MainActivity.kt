package com.vocalpaper.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.vocalpaper.app.ui.screens.LibraryScreen
import com.vocalpaper.app.ui.screens.ReaderScreen
import com.vocalpaper.app.ui.screens.SettingsScreen
import com.vocalpaper.app.ui.theme.VocalPaperTheme
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            VocalPaperTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    val navController = rememberNavController()
                    NavHost(navController = navController, startDestination = "library") {
                        composable("library") {
                            LibraryScreen(
                                onNavigateToReader = { documentId ->
                                    navController.navigate("reader/$documentId")
                                },
                                onNavigateToSettings = {
                                    navController.navigate("settings")
                                }
                            )
                        }
                        composable("reader/{documentId}") { backStackEntry ->
                            val documentId = backStackEntry.arguments?.getString("documentId")?.toLongOrNull() ?: -1L
                            ReaderScreen(
                                documentId = documentId,
                                onNavigateBack = {
                                    navController.popBackStack()
                                }
                            )
                        }
                        composable("settings") {
                            SettingsScreen(
                                onNavigateBack = {
                                    navController.popBackStack()
                                }
                            )
                        }
                    }
                }
            }
        }
    }
}
