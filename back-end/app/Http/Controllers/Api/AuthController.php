<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    public function register(Request $request){
        try{
            $request->validate([
            'name' => 'required',
            'email' => 'required|email|unique:users',
            'password' => 'required|min:6'
            ]);

            $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => bcrypt($request->password)
            ]);

            $token = $user->createToken('flowful_token')->plainTextToken;

            return response()->json([
                'user' => $user,
                'token' => $token
            ]);
        }
        catch (\Exception $e) {
            return response()->json([
                'message' => 'Something went wrong',
                'error' => $e->getMessage()
            ], 500);
        }
        
    }  
    
    public function login(Request $request){
        try{
            if (!Auth::attempt($request->only('email','password'))){
                return response()->json([
                    'message' => 'Invalid credentials'
                ], 401);
            }
            
            $user = Auth::user();
            $token = $user->createToken('flowful_token')->plainTextToken;
            
            return response()->json([
                'user' => $user,
                'token' => $token
            ]);
        }catch (\Exception $e) {
            return response()->json([
                'message' => 'Something went wrong',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function me(Request $request){
        try{
            return response()->json($request->user());
        }
        catch(\Exception $e){
            return response()->json([
                'message' => 'Something went wrong',
                'error' => $e->getMessage()
            ], 500);
        }   
        
    }

    public function logout(Request $request){
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged Out'
        ]);
    }
}
