from django.urls import path
from .views import AgentListView, AgentCreateView, AgentDeleteView

urlpatterns = [
    path('',          AgentListView.as_view(),   name='agent-list'),
    path('create/',   AgentCreateView.as_view(),  name='agent-create'),
    path('<int:pk>/', AgentDeleteView.as_view(),  name='agent-delete'),
]
